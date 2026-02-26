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
    public async Task<ActionResult> GetAllUsers(int page = 1, int pageSize = 25)
    {
        var query = _userManager.Users.AsNoTracking();

        var totalCount = await query.CountAsync();

        var users = await query
            .OrderBy(u => u.UserName)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .Select(u => new
            {
                id = u.Id,
                name = u.DisplayName,
                email = u.Email,
                status = u.Status
            })
            .ToListAsync();

        return Ok(new
        {
            items = users,
            totalCount,
            page,
            pageSize
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
}
