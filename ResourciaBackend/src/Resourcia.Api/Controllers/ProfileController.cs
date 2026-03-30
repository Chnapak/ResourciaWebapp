using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Resourcia.Api.Models.Profile;
using Resourcia.Api.Services;
using Resourcia.Api.Utils;

namespace Resourcia.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class ProfileController : ControllerBase
{
    private readonly ProfileService _profileService;

    public ProfileController(ProfileService profileService)
    {
        _profileService = profileService;
    }

    [HttpGet("{identifier}")]
    public async Task<IActionResult> GetProfile(string identifier, CancellationToken ct)
    {
        var currentUserId = User.Identity?.IsAuthenticated == true ? User.GetUserId() : (Guid?)null;
        var (profile, error, status) = await _profileService.GetProfileAsync(identifier, currentUserId, ct);

        return status switch
        {
            200 => Ok(profile),
            400 => BadRequest(new { error }),
            404 => NotFound(new { error }),
            _ => StatusCode(status, new { error })
        };
    }

    [Authorize]
    [HttpPatch("me")]
    public async Task<IActionResult> UpdateProfile([FromBody] UpdateProfileModel model, CancellationToken ct)
    {
        var currentUserId = User.GetUserId();
        var (profile, error, status) = await _profileService.UpdateProfileAsync(currentUserId, model, ct);

        return status switch
        {
            200 => Ok(profile),
            400 => BadRequest(new { error }),
            404 => NotFound(new { error }),
            _ => StatusCode(status, new { error })
        };
    }
}
