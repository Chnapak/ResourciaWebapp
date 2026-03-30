using System.Text.Json;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using NodaTime;
using Resourcia.Api.Models.Profile;
using Resourcia.Api.Utils;
using Resourcia.Data;
using Resourcia.Data.Entities.Identity;
using Resourcia.Data.Interfaces;

namespace Resourcia.Api.Services;

public class ProfileService
{
    private readonly AppDbContext _db;
    private readonly UserManager<AppUser> _userManager;
    private readonly IClock _clock;
    private readonly CacheService _cache;

    public ProfileService(AppDbContext db, UserManager<AppUser> userManager, IClock clock, CacheService cache)
    {
        _db = db;
        _userManager = userManager;
        _clock = clock;
        _cache = cache;
    }

    public async Task<(ProfileResponseModel? Profile, string? Error, int StatusCode)> GetProfileAsync(
        string identifier,
        Guid? currentUserId,
        CancellationToken ct = default)
    {
        if (string.IsNullOrWhiteSpace(identifier))
        {
            return (null, "Profile identifier is required.", 400);
        }

        var user = await ResolveUserAsync(identifier.Trim(), currentUserId, ct);
        if (user == null)
        {
            return (null, "Profile not found.", 404);
        }

        var profile = await BuildProfileAsync(user, ct);
        return (profile, null, 200);
    }

    public async Task<(ProfileResponseModel? Profile, string? Error, int StatusCode)> UpdateProfileAsync(
        Guid userId,
        UpdateProfileModel model,
        CancellationToken ct = default)
    {
        var displayName = model.DisplayName.Trim();
        var handle = ProfileHandleUtility.BuildHandle(model.Handle);

        if (string.IsNullOrWhiteSpace(displayName))
        {
            return (null, "Display name is required.", 400);
        }

        if (string.IsNullOrWhiteSpace(handle))
        {
            return (null, "A valid handle is required.", 400);
        }

        var cleanedInterests = CleanInterests(model.Interests);
        if (cleanedInterests.Count > 10)
        {
            return (null, "You can save up to 10 interests.", 400);
        }

        var user = await _userManager.Users
            .FirstOrDefaultAsync(currentUser => currentUser.Id == userId, ct);

        if (user == null)
        {
            return (null, "Profile not found.", 404);
        }

        var normalizedDisplayName = displayName.ToUpperInvariant();
        var normalizedHandle = handle.ToUpperInvariant();

        var displayNameTaken = await _userManager.Users
            .AsNoTracking()
            .AnyAsync(currentUser => currentUser.Id != userId && currentUser.DisplayName.ToUpper() == normalizedDisplayName, ct);

        if (displayNameTaken)
        {
            return (null, "Display name is already in use.", 400);
        }

        var handleTaken = await _userManager.Users
            .AsNoTracking()
            .AnyAsync(currentUser => currentUser.Id != userId && currentUser.Handle != null && currentUser.Handle.ToUpper() == normalizedHandle, ct);

        if (handleTaken)
        {
            return (null, "Handle is already in use.", 400);
        }

        var previousDisplayName = user.DisplayName;
        var displayNameChanged = !string.Equals(previousDisplayName, displayName, StringComparison.Ordinal);
        var impactedResourceIds = new HashSet<Guid>();

        user.DisplayName = displayName;
        user.Handle = handle;
        user.Bio = NullIfWhiteSpace(model.Bio);
        user.Location = NullIfWhiteSpace(model.Location);
        user.Website = NormalizeWebsite(model.Website);
        user.InterestsJson = cleanedInterests.Count == 0 ? null : JsonSerializer.Serialize(cleanedInterests);
        user.SetModifyBy(displayName, _clock.GetCurrentInstant());

        if (displayNameChanged)
        {
            impactedResourceIds.UnionWith(await _db.Resources
                .AsNoTracking()
                .Where(resource => resource.CreatedBy == previousDisplayName)
                .Select(resource => resource.Id)
                .ToListAsync(ct));

            impactedResourceIds.UnionWith(await _db.ResourceReviews
                .AsNoTracking()
                .Where(review => review.UserId == userId)
                .Select(review => review.ResourceId)
                .Distinct()
                .ToListAsync(ct));

            impactedResourceIds.UnionWith(await _db.Discussions
                .AsNoTracking()
                .Where(discussion => discussion.UserId == userId)
                .Select(discussion => discussion.ResourceId)
                .Distinct()
                .ToListAsync(ct));

            impactedResourceIds.UnionWith(await (
                from reply in _db.DiscussionReplies.AsNoTracking()
                join discussion in _db.Discussions.AsNoTracking() on reply.DiscussionId equals discussion.Id
                where reply.UserId == userId
                select discussion.ResourceId)
                .Distinct()
                .ToListAsync(ct));

            var ownedResources = await _db.Resources
                .Where(resource => resource.CreatedBy == previousDisplayName)
                .ToListAsync(ct);

            foreach (var resource in ownedResources)
            {
                resource.CreatedBy = displayName;
            }
        }

        await _db.SaveChangesAsync(ct);

        if (displayNameChanged)
        {
            foreach (var resourceId in impactedResourceIds)
            {
                await _cache.InvalidateAsync($"resource:v4:{resourceId}");
                await _cache.InvalidateAsync($"threads:{resourceId}");
            }
        }

        var profile = await BuildProfileAsync(user, ct);
        return (profile, null, 200);
    }

    private async Task<ProfileResponseModel> BuildProfileAsync(AppUser user, CancellationToken ct)
    {
        var roles = await _userManager.GetRolesAsync(user);
        var sharedResources = await GetSharedResourcesAsync(user, ct);
        var recentReviews = await GetRecentReviewsAsync(user.Id, ct);
        var recentActivity = BuildRecentActivity(user, sharedResources, recentReviews);

        var helpfulVotes = await (
            from vote in _db.ReviewsVotes.AsNoTracking()
            join review in _db.ResourceReviews.AsNoTracking() on vote.ReviewId equals review.Id
            where vote.IsHelpful && review.UserId == user.Id
            select vote)
            .CountAsync(ct);

        var latestResourceAt = sharedResources.Select(resource => (DateTime?)resource.AddedAt).FirstOrDefault();
        var latestReviewAt = recentReviews.Select(review => (DateTime?)review.PostedAt).FirstOrDefault();
        var latestDiscussionAt = await _db.Discussions
            .AsNoTracking()
            .Where(discussion => discussion.UserId == user.Id)
            .OrderByDescending(discussion => discussion.CreatedAt)
            .Select(discussion => (Instant?)discussion.CreatedAt)
            .FirstOrDefaultAsync(ct);

        var joinedAt = user.CreatedAt.ToDateTimeUtc();
        var lastActive = new[]
        {
            joinedAt,
            latestResourceAt,
            latestReviewAt,
            latestDiscussionAt?.ToDateTimeUtc()
        }
        .Where(value => value.HasValue)
        .Select(value => value!.Value)
        .DefaultIfEmpty(joinedAt)
        .Max();

        var resourcesShared = await _db.Resources
            .AsNoTracking()
            .CountAsync(resource => resource.CreatedBy == user.DisplayName, ct);

        var resourcesSaved = await _db.Resources
            .AsNoTracking()
            .Where(resource => resource.CreatedBy == user.DisplayName)
            .SumAsync(resource => (int?)resource.SavesCount, ct) ?? 0;

        var reviewsWritten = await _db.ResourceReviews
            .AsNoTracking()
            .CountAsync(review => review.UserId == user.Id, ct);

        var interests = GetStoredInterests(user);
        if (interests.Count == 0)
        {
            interests = await BuildFallbackInterestsAsync(user, sharedResources, ct);
        }

        return new ProfileResponseModel
        {
            Id = user.Id.ToString(),
            Name = user.DisplayName,
            Handle = string.IsNullOrWhiteSpace(user.Handle) ? ProfileHandleUtility.BuildHandle(user.DisplayName) : user.Handle,
            Bio = string.IsNullOrWhiteSpace(user.Bio) ? BuildBio(user.DisplayName, resourcesShared, reviewsWritten) : user.Bio,
            AvatarInitials = BuildAvatarInitials(user.DisplayName),
            Role = MapRole(roles),
            IsVerified = user.EmailConfirmed,
            JoinedAt = joinedAt,
            LastActive = lastActive,
            Location = user.Location,
            Website = user.Website,
            Interests = interests,
            Stats = new ProfileStatsModel
            {
                ResourcesShared = resourcesShared,
                ReviewsWritten = reviewsWritten,
                HelpfulVotes = helpfulVotes,
                ResourcesSaved = resourcesSaved
            },
            SharedResources = sharedResources,
            RecentReviews = recentReviews,
            RecentActivity = recentActivity
        };
    }

    private async Task<AppUser?> ResolveUserAsync(string identifier, Guid? currentUserId, CancellationToken ct)
    {
        if (string.Equals(identifier, "me", StringComparison.OrdinalIgnoreCase))
        {
            if (!currentUserId.HasValue)
            {
                return null;
            }

            return await _userManager.Users
                .AsNoTracking()
                .FirstOrDefaultAsync(user => user.Id == currentUserId.Value, ct);
        }

        if (Guid.TryParse(identifier, out var userId))
        {
            return await _userManager.Users
                .AsNoTracking()
                .FirstOrDefaultAsync(user => user.Id == userId, ct);
        }

        var normalizedIdentifier = identifier.ToUpperInvariant();

        var handleMatch = await _userManager.Users
            .AsNoTracking()
            .FirstOrDefaultAsync(user => user.Handle != null && user.Handle.ToUpper() == normalizedIdentifier, ct);

        if (handleMatch != null)
        {
            return handleMatch;
        }

        return await _userManager.Users
            .AsNoTracking()
            .FirstOrDefaultAsync(user => user.DisplayName.ToUpper() == normalizedIdentifier, ct);
    }

    private async Task<List<ProfileResourceModel>> GetSharedResourcesAsync(AppUser user, CancellationToken ct)
    {
        var resources = await _db.Resources
            .AsNoTracking()
            .Where(resource => resource.CreatedBy == user.DisplayName)
            .OrderByDescending(resource => resource.CreatedAtUtc)
            .Take(6)
            .Select(resource => new
            {
                resource.Id,
                resource.Title,
                resource.Url,
                resource.LearningStyle,
                AverageRating = resource.Ratings == null ? 0 : resource.Ratings.AverageRating,
                RatingCount = resource.Ratings == null ? 0 : resource.Ratings.TotalCount,
                resource.SavesCount,
                resource.CreatedAtUtc
            })
            .ToListAsync(ct);

        return resources
            .Select(resource => new ProfileResourceModel
            {
                Id = resource.Id.ToString(),
                Title = resource.Title,
                Domain = GetDomain(resource.Url),
                Type = GetResourceType(resource.LearningStyle),
                Rating = Math.Round(resource.AverageRating, 1),
                RatingCount = resource.RatingCount,
                Saves = resource.SavesCount,
                AddedAt = resource.CreatedAtUtc
            })
            .ToList();
    }

    private async Task<List<ProfileReviewModel>> GetRecentReviewsAsync(Guid userId, CancellationToken ct)
    {
        var reviews = await _db.ResourceReviews
            .AsNoTracking()
            .Where(review => review.UserId == userId)
            .OrderByDescending(review => review.CreatedAt)
            .Take(6)
            .Select(review => new
            {
                review.Id,
                ResourceTitle = review.Resource.Title,
                review.ResourceId,
                review.Rating,
                Body = review.Content,
                Helpful = _db.ReviewsVotes.Count(vote => vote.ReviewId == review.Id && vote.IsHelpful),
                NotHelpful = _db.ReviewsVotes.Count(vote => vote.ReviewId == review.Id && !vote.IsHelpful),
                review.CreatedAt
            })
            .ToListAsync(ct);

        return reviews
            .Select(review => new ProfileReviewModel
            {
                Id = review.Id.ToString(),
                ResourceTitle = review.ResourceTitle,
                ResourceId = review.ResourceId.ToString(),
                Rating = review.Rating,
                Body = review.Body,
                Helpful = review.Helpful,
                NotHelpful = review.NotHelpful,
                PostedAt = review.CreatedAt?.ToDateTimeUtc() ?? DateTime.UtcNow
            })
            .ToList();
    }

    private static List<ProfileActivityModel> BuildRecentActivity(
        AppUser user,
        List<ProfileResourceModel> sharedResources,
        List<ProfileReviewModel> recentReviews)
    {
        return sharedResources
            .Select(resource => new ProfileActivityModel
            {
                Id = $"resource:{resource.Id}",
                Type = "shared_resource",
                Description = "Shared a new resource",
                Target = resource.Title,
                TargetId = resource.Id,
                Timestamp = resource.AddedAt
            })
            .Concat(recentReviews.Select(review => new ProfileActivityModel
            {
                Id = $"review:{review.Id}",
                Type = "wrote_review",
                Description = "Wrote a review for",
                Target = review.ResourceTitle,
                TargetId = review.ResourceId,
                Timestamp = review.PostedAt
            }))
            .Append(new ProfileActivityModel
            {
                Id = $"joined:{user.Id}",
                Type = "joined",
                Description = "Joined Resourcia",
                Timestamp = user.CreatedAt.ToDateTimeUtc()
            })
            .OrderByDescending(item => item.Timestamp)
            .Take(8)
            .ToList();
    }

    private static List<string> GetStoredInterests(AppUser user)
    {
        if (string.IsNullOrWhiteSpace(user.InterestsJson))
        {
            return [];
        }

        try
        {
            return CleanInterests(JsonSerializer.Deserialize<List<string>>(user.InterestsJson) ?? []);
        }
        catch
        {
            return [];
        }
    }

    private async Task<List<string>> BuildFallbackInterestsAsync(
        AppUser user,
        List<ProfileResourceModel> sharedResources,
        CancellationToken ct)
    {
        var interests = sharedResources
            .Select(resource => resource.Type)
            .Where(type => !string.IsNullOrWhiteSpace(type) && !string.Equals(type, "Resource", StringComparison.OrdinalIgnoreCase))
            .Distinct(StringComparer.OrdinalIgnoreCase)
            .Take(5)
            .ToList();

        if (interests.Count > 0)
        {
            return interests;
        }

        var resourceTags = await _db.Resources
            .AsNoTracking()
            .Where(resource => resource.CreatedBy == user.DisplayName)
            .Take(20)
            .ToListAsync(ct);

        return resourceTags
            .SelectMany(resource => resource.Tags ?? [])
            .Where(tag => !string.IsNullOrWhiteSpace(tag))
            .Distinct(StringComparer.OrdinalIgnoreCase)
            .Take(5)
            .ToList();
    }

    private static List<string> CleanInterests(IEnumerable<string>? interests)
    {
        return (interests ?? [])
            .Select(interest => interest.Trim())
            .Where(interest => !string.IsNullOrWhiteSpace(interest))
            .Distinct(StringComparer.OrdinalIgnoreCase)
            .Take(10)
            .ToList();
    }

    private static string? NormalizeWebsite(string? website)
    {
        var trimmed = NullIfWhiteSpace(website);
        if (trimmed == null)
        {
            return null;
        }

        return trimmed
            .Replace("https://", string.Empty, StringComparison.OrdinalIgnoreCase)
            .Replace("http://", string.Empty, StringComparison.OrdinalIgnoreCase)
            .TrimEnd('/');
    }

    private static string? NullIfWhiteSpace(string? value)
    {
        return string.IsNullOrWhiteSpace(value) ? null : value.Trim();
    }

    private static string BuildBio(string displayName, int resourcesShared, int reviewsWritten)
    {
        if (resourcesShared == 0 && reviewsWritten == 0)
        {
            return $"{displayName} is part of the Resourcia learning community.";
        }

        return $"{displayName} has shared {resourcesShared} resources and written {reviewsWritten} reviews on Resourcia.";
    }

    private static string BuildAvatarInitials(string displayName)
    {
        var initials = displayName
            .Split(' ', StringSplitOptions.RemoveEmptyEntries)
            .Select(part => part[0])
            .Take(2)
            .ToArray();

        return initials.Length == 0 ? "R" : new string(initials).ToUpperInvariant();
    }

    private static string MapRole(IList<string> roles)
    {
        if (roles.Any(role => string.Equals(role, "Owner", StringComparison.OrdinalIgnoreCase) ||
                              string.Equals(role, "Admin", StringComparison.OrdinalIgnoreCase)))
        {
            return "admin";
        }

        return "contributor";
    }

    private static string GetDomain(string url)
    {
        if (Uri.TryCreate(url, UriKind.Absolute, out var uri))
        {
            return uri.Host;
        }

        return url;
    }

    private static string GetResourceType(string learningStyle)
    {
        if (string.IsNullOrWhiteSpace(learningStyle))
        {
            return "Resource";
        }

        return learningStyle;
    }
}
