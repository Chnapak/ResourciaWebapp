using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Identity;
using Resourcia.Api.Models.Profile;
using Resourcia.Api.Services;
using Resourcia.Api.Utils;
using Resourcia.Data.Entities.Identity;
using System.IO;

namespace Resourcia.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class ProfileController : ControllerBase
{
    private readonly ProfileService _profileService;
    private readonly UserManager<AppUser> _userManager;
    private readonly ImageService _imageService;

    public ProfileController(ProfileService profileService, UserManager<AppUser> userManager, ImageService imageService)
    {
        _profileService = profileService;
        _userManager = userManager;
        _imageService = imageService;
    }

    [HttpGet("{identifier}")]
    public async Task<IActionResult> GetProfile(string identifier, CancellationToken ct)
    {
        var currentUserId = User.Identity?.IsAuthenticated == true ? User.GetUserId() : (Guid?)null;
        var baseUrl = $"{Request.Scheme}://{Request.Host}";
        var (profile, error, status) = await _profileService.GetProfileAsync(identifier, currentUserId, baseUrl, ct);

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
        var baseUrl = $"{Request.Scheme}://{Request.Host}";
        var (profile, error, status) = await _profileService.UpdateProfileAsync(currentUserId, model, baseUrl, ct);

        return status switch
        {
            200 => Ok(profile),
            400 => BadRequest(new { error }),
            404 => NotFound(new { error }),
            _ => StatusCode(status, new { error })
        };
    }

    [Authorize]
    [HttpDelete("me")]
    public async Task<IActionResult> DeleteProfile(CancellationToken ct)
    {
        var currentUserId = User.GetUserId();
        var (error, status) = await _profileService.DeleteProfileAsync(currentUserId, ct);

        if (status == 204)
        {
            Response.Cookies.Delete("RefreshToken");
            return NoContent();
        }

        return status switch
        {
            400 => BadRequest(new { error }),
            404 => NotFound(new { error }),
            _ => StatusCode(status, new { error })
        };
    }

    [Authorize]
    [HttpPost("me/avatar")]
    public async Task<IActionResult> UploadAvatar([FromForm] IFormFile file, CancellationToken ct)
    {
        if (file == null || file.Length == 0)
        {
            return BadRequest(new { error = "No file provided." });
        }

        if (!_imageService.IsValidImage(file))
        {
            return BadRequest(new { error = "Invalid image type or size." });
        }

        var currentUserId = User.GetUserId();
        var user = await _userManager.FindByIdAsync(currentUserId.ToString());
        if (user == null)
        {
            return NotFound(new { error = "Profile not found." });
        }

        // Remove previous avatar file if present.
        if (!string.IsNullOrWhiteSpace(user.AvatarFileName))
        {
            var oldPath = Path.Combine(Directory.GetCurrentDirectory(), "wwwroot", "uploads", user.AvatarFileName);
            if (System.IO.File.Exists(oldPath))
            {
                try { System.IO.File.Delete(oldPath); } catch { /* ignore */ }
            }
        }

        var savedFileName = await _imageService.SaveImageAsync(file);
        user.AvatarFileName = savedFileName;

        await _userManager.UpdateAsync(user);

        var baseUrl = $"{Request.Scheme}://{Request.Host}";
        return Ok(new
        {
            AvatarUrl = $"{baseUrl}/uploads/{savedFileName}"
        });
    }

    [Authorize]
    [HttpDelete("me/avatar")]
    public async Task<IActionResult> DeleteAvatar()
    {
        var currentUserId = User.GetUserId();
        var user = await _userManager.FindByIdAsync(currentUserId.ToString());
        if (user == null)
        {
            return NotFound(new { error = "Profile not found." });
        }

        if (!string.IsNullOrWhiteSpace(user.AvatarFileName))
        {
            var path = Path.Combine(Directory.GetCurrentDirectory(), "wwwroot", "uploads", user.AvatarFileName);
            if (System.IO.File.Exists(path))
            {
                try { System.IO.File.Delete(path); } catch { /* ignore */ }
            }
        }

        user.AvatarFileName = null;
        await _userManager.UpdateAsync(user);

        return NoContent();
    }
}
