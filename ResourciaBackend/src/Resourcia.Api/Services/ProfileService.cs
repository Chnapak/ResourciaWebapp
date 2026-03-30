using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using NodaTime;
using Resourcia.Api.Models.Profile;
using Resourcia.Data;
using Resourcia.Data.Entities.Identity;

namespace Resourcia.Api.Services;

public class ProfileService
{
    private readonly AppDbContext _db;
    private readonly UserManager<AppUser> _userManager;

    public ProfileService(AppDbContext db, UserManager<AppUser> userManager)
    {
        _db = db;
        _userManager = userManager;
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

        var latestResourceAt = sharedResources.Select(r => (DateTime?)r.AddedAt).FirstOrDefault();
        var latestReviewAt = recentReviews.Select(r => (DateTime?)r.PostedAt).FirstOrDefault();
        var latestDiscussionAt = await _db.Discussions
            .AsNoTracking()
            .Where(d => d.UserId == user.Id)
            .OrderByDescending(d => d.CreatedAt)
            .Select(d => (Instant?)d.CreatedAt)
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
            .CountAsync(r => r.CreatedBy == user.DisplayName, ct);

        var resourcesSaved = await _db.Resources
            .AsNoTracking()
            .Where(r => r.CreatedBy == user.DisplayName)
            .SumAsync(r => (int?)r.SavesCount, ct) ?? 0;

        var reviewsWritten = await _db.ResourceReviews
            .AsNoTracking()
            .CountAsync(r => r.UserId == user.Id, ct);

        var interests = sharedResources
            .Select(r => r.Type)
            .Where(type => !string.IsNullOrWhiteSpace(type) && !string.Equals(type, "Resource", StringComparison.OrdinalIgnoreCase))
            .Distinct(StringComparer.OrdinalIgnoreCase)
            .Take(5)
            .ToList();

        if (interests.Count == 0)
        {
            var resourceTags = await _db.Resources
                .AsNoTracking()
                .Where(r => r.CreatedBy == user.DisplayName)
                .Take(20)
                .ToListAsync(ct);

            interests = resourceTags
                .SelectMany(resource => resource.Tags ?? [])
                .Where(tag => !string.IsNullOrWhiteSpace(tag))
                .Distinct(StringComparer.OrdinalIgnoreCase)
                .Take(5)
                .ToList();
        }

        var profile = new ProfileResponseModel
        {
            Id = user.Id.ToString(),
            Name = user.DisplayName,
            Handle = BuildHandle(user.DisplayName),
            Bio = BuildBio(user.DisplayName, resourcesShared, reviewsWritten),
            AvatarInitials = BuildAvatarInitials(user.DisplayName),
            Role = MapRole(roles),
            IsVerified = user.EmailConfirmed,
            JoinedAt = joinedAt,
            LastActive = lastActive,
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

        return (profile, null, 200);
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

        var normalizedDisplayName = identifier.ToUpperInvariant();
        return await _userManager.Users
            .AsNoTracking()
            .FirstOrDefaultAsync(user => user.DisplayName.ToUpper() == normalizedDisplayName, ct);
    }

    private async Task<List<ProfileResourceModel>> GetSharedResourcesAsync(AppUser user, CancellationToken ct)
    {
        var resources = await _db.Resources
            .AsNoTracking()
            .Where(r => r.CreatedBy == user.DisplayName)
            .OrderByDescending(r => r.CreatedAtUtc)
            .Take(6)
            .Select(r => new
            {
                r.Id,
                r.Title,
                r.Url,
                r.LearningStyle,
                AverageRating = r.Ratings == null ? 0 : r.Ratings.AverageRating,
                RatingCount = r.Ratings == null ? 0 : r.Ratings.TotalCount,
                r.SavesCount,
                r.CreatedAtUtc
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
        var activity = sharedResources
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

        return activity;
    }

    private static string BuildHandle(string displayName)
    {
        return displayName
            .Trim()
            .ToLowerInvariant()
            .Replace(" ", string.Empty);
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
