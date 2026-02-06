using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Resourcia.Data.Entities.Identity;

namespace Resourcia.Api.Controllers;

[Route("api/admin/users")]
[ApiController]
[Authorize(Roles = "Admin")]
public class AdminUsersController : ControllerBase
{
    private readonly UserManager<AppUser> _userManager;

    public AdminUsersController(UserManager<AppUser> userManager)
    {
        _userManager = userManager;
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
                u.Id,
                u.UserName,
                u.Email
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
}
