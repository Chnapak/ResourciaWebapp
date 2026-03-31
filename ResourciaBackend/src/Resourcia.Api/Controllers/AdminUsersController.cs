using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Http.HttpResults;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using NodaTime;
using Resourcia.Api.Models.Admin;
using Resourcia.Data;
using Resourcia.Data.Entities.Identity;

namespace Resourcia.Api.Controllers;

[Route("api/admin/users")]
[ApiController]
[Authorize(Roles = "Admin")]
public class AdminUsersController : ControllerBase
{
    private readonly UserManager<AppUser> _userManager;
    private readonly AppDbContext _dbContext;
    private readonly IClock _clock;

    public AdminUsersController(UserManager<AppUser> userManager, AppDbContext dbContext, IClock clock)
    {
        _userManager = userManager;
        _dbContext = dbContext;
        _clock = clock;
    }

    [HttpGet]
    public async Task<ActionResult<AdminUserListResponseModel>> GetAllUsers(int page = 1, int pageSize = 25)
    {
        page = Math.Max(page, 1);
        pageSize = Math.Clamp(pageSize, 1, 100);

        var query = _userManager.Users.AsNoTracking();

        var totalCount = await query.CountAsync();

        var users = await query
            .OrderBy(u => u.DisplayName)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .ToListAsync();

        var userIds = users.Select(user => user.Id).ToArray();
        var displayNames = users
            .Select(user => user.DisplayName)
            .Where(displayName => !string.IsNullOrWhiteSpace(displayName))
            .Distinct(StringComparer.Ordinal)
            .ToArray();

        var resourceSummaries = await _dbContext.Resources
            .AsNoTracking()
            .Where(resource => resource.CreatedBy != null && displayNames.Contains(resource.CreatedBy))
            .GroupBy(resource => resource.CreatedBy!)
            .Select(group => new
            {
                DisplayName = group.Key,
                ResourcesCount = group.Count(),
                LastResourceActivityAt = group.Max(resource => (DateTime?)resource.UpdatedAtUtc)
            })
            .ToListAsync();

        var savedResourceSummaries = await _dbContext.SavedResources
            .AsNoTracking()
            .Where(savedResource => userIds.Contains(savedResource.UserId))
            .GroupBy(savedResource => savedResource.UserId)
            .Select(group => new
            {
                UserId = group.Key,
                LastSavedAt = group.Max(savedResource => (DateTime?)savedResource.CreatedAtUtc)
            })
            .ToListAsync();

        var reviewSummaries = await _dbContext.ResourceReviews
            .AsNoTracking()
            .Where(review => userIds.Contains(review.UserId))
            .GroupBy(review => review.UserId)
            .Select(group => new
            {
                UserId = group.Key,
                LastUpdatedAt = group.Max(review => review.UpdatedAt),
                LastCreatedAt = group.Max(review => review.CreatedAt)
            })
            .ToListAsync();

        var discussionSummaries = await _dbContext.Discussions
            .AsNoTracking()
            .Where(discussion => userIds.Contains(discussion.UserId))
            .GroupBy(discussion => discussion.UserId)
            .Select(group => new
            {
                UserId = group.Key,
                LastDiscussionAt = group.Max(discussion => (Instant?)discussion.CreatedAt)
            })
            .ToListAsync();

        var resourceSummaryByDisplayName = resourceSummaries.ToDictionary(
            summary => summary.DisplayName,
            StringComparer.Ordinal);

        var savedSummaryByUserId = savedResourceSummaries.ToDictionary(summary => summary.UserId);
        var reviewSummaryByUserId = reviewSummaries.ToDictionary(summary => summary.UserId);
        var discussionSummaryByUserId = discussionSummaries.ToDictionary(summary => summary.UserId);

        var items = new List<AdminUserListItemModel>(users.Count);

        foreach (var user in users)
        {
            var joinedAt = user.CreatedAt.ToDateTimeUtc();
            var lastActiveAt = joinedAt;
            var resourcesCount = 0;

            if (resourceSummaryByDisplayName.TryGetValue(user.DisplayName, out var resourceSummary))
            {
                resourcesCount = resourceSummary.ResourcesCount;
                lastActiveAt = Max(lastActiveAt, resourceSummary.LastResourceActivityAt);
            }

            if (savedSummaryByUserId.TryGetValue(user.Id, out var savedSummary))
            {
                lastActiveAt = Max(lastActiveAt, savedSummary.LastSavedAt);
            }

            if (reviewSummaryByUserId.TryGetValue(user.Id, out var reviewSummary))
            {
                lastActiveAt = Max(lastActiveAt, reviewSummary.LastUpdatedAt);
                lastActiveAt = Max(lastActiveAt, reviewSummary.LastCreatedAt);
            }

            if (discussionSummaryByUserId.TryGetValue(user.Id, out var discussionSummary))
            {
                lastActiveAt = Max(lastActiveAt, discussionSummary.LastDiscussionAt);
            }

            var roles = await _userManager.GetRolesAsync(user);
            var (role, roleLabel) = MapRole(roles);

            items.Add(new AdminUserListItemModel
            {
                Id = user.Id.ToString(),
                Name = user.DisplayName,
                Handle = string.IsNullOrWhiteSpace(user.Handle) ? user.DisplayName : user.Handle,
                Email = user.Email ?? string.Empty,
                Role = role,
                RoleLabel = roleLabel,
                Status = MapStatus(user.Status),
                ResourcesCount = resourcesCount,
                LastActiveAt = lastActiveAt
            });
        }

        return Ok(new AdminUserListResponseModel
        {
            Items = items,
            TotalCount = totalCount,
            Page = page,
            PageSize = pageSize
        });
    }

    [HttpPost("{id:guid}/suspend")]
    public async Task<IActionResult> SuspendUser(string id, [FromBody] AdminSuspensionModel suspensionRequest)
    {
        var user = await _userManager.FindByIdAsync(id);
        if (user == null)
        {
            return NotFound();
        }
        if (user.DeletedAt != null)
        {
            return NotFound("User is deactivated");
        }

        user.Status = UserStatus.Suspended;
        user.ModerationReason = suspensionRequest.reason;
        Console.WriteLine($"Suspending user {user.UserName} for reason: {suspensionRequest.reason} for {suspensionRequest.durationDays} days");
        await _userManager.SetLockoutEndDateAsync(user, DateTimeOffset.UtcNow.AddDays(suspensionRequest.durationDays));
        return NoContent();
    }

    [HttpPost("{id:guid}/unsuspend")]
    public async Task<IActionResult> UnsuspendUser(string id)
    {
        var user = await _userManager.FindByIdAsync(id);
        if (user == null)
        {
            return NotFound();
        }
        if (user.DeletedAt != null)
        {
            return NotFound("User is deactivated");
        }
        user.Status = UserStatus.Active;
        user.ModerationReason = null;
        await _userManager.SetLockoutEndDateAsync(user, DateTimeOffset.UtcNow);
        return NoContent();
    }

    [HttpPost("{id:guid}/ban")]
    public async Task<IActionResult> BanUser(string id, [FromBody] AdminBanModel banRequest)
    {
        var user = await _userManager.FindByIdAsync(id);
        if (user == null)
        {
            return NotFound();
        }
        if (user.DeletedAt != null)
        {
            return NotFound("User is deactivated");
        }
        user.Status = UserStatus.Banned;
        user.ModerationReason = banRequest.reason;
        await _userManager.SetLockoutEndDateAsync(user, DateTimeOffset.MaxValue);
        return NoContent();
    }

    [HttpPost("{id:guid}/unban")]
    public async Task<IActionResult> UnbanUser(string id)
    {
        var user = await _userManager.FindByIdAsync(id);
        if (user == null)
        {
            return NotFound();
        }
        if (user.DeletedAt != null)
        {
            return NotFound("User is deactivated");
        }
        user.Status = UserStatus.Active;
        user.ModerationReason = null;
        await _userManager.SetLockoutEndDateAsync(user, DateTimeOffset.UtcNow);
        return NoContent();
    }

    [HttpDelete("{id:guid}")]
    public async Task<IActionResult> DeleteUser(string id)
    {
        var user = await _userManager.FindByIdAsync(id);
        if (user == null)
        {
            return NotFound();
        }

        if (user.DeletedAt != null)
        {
            return NotFound("User is deactivated");
        }

        user.DeletedAt = _clock.GetCurrentInstant();
        await _userManager.UpdateAsync(user);

        return NoContent();

    }

    private static DateTime Max(DateTime currentValue, DateTime? candidate)
    {
        return candidate.HasValue && candidate.Value > currentValue
            ? candidate.Value
            : currentValue;
    }

    private static DateTime Max(DateTime currentValue, Instant? candidate)
    {
        return candidate.HasValue
            ? Max(currentValue, candidate.Value.ToDateTimeUtc())
            : currentValue;
    }

    private static string MapStatus(UserStatus status)
    {
        return status switch
        {
            UserStatus.Suspended => "suspended",
            UserStatus.Banned => "banned",
            _ => "active"
        };
    }

    private static (string Role, string RoleLabel) MapRole(IList<string> roles)
    {
        if (roles.Any(role =>
                string.Equals(role, "Owner", StringComparison.OrdinalIgnoreCase) ||
                string.Equals(role, "Admin", StringComparison.OrdinalIgnoreCase)))
        {
            return ("admin", "Admin");
        }

        return ("contributor", "Contributor");
    }
}
