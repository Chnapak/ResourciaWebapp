using Microsoft.AspNetCore.Identity;
using Resourcia.Data.Entities.Identity;
using System.Security.Claims;

namespace Resourcia.Api.Services;

public class OAuthService
{
    private readonly UserManager<AppUser> _userManager;

    public OAuthService(UserManager<AppUser> userManager)
    {
        _userManager = userManager;
    }

    public async Task<(AppUser? User, string? Provider, string? ProviderKey, string? Email, string? Name, bool NeedsProfile)> HandleExternalLoginAsync(ExternalLoginInfo info)
    {
        var email = info.Principal.FindFirstValue(ClaimTypes.Email);
        var name = info.Principal.FindFirstValue(ClaimTypes.Name); 
        
        // Find existing user by provider
        var user = await _userManager.FindByLoginAsync(info.LoginProvider, info.ProviderKey);
        
        if (user != null)
        {
            return (user, null, null, null, null, false);
        }

        // Check if an account already exists with this email
        // Auto-link if emails match (assuming OAuth provider verified the email)
        if (!string.IsNullOrEmpty(email))
        {
            user = await _userManager.FindByEmailAsync(email);
            if (user != null)
            {
                // Link accounts
                await _userManager.AddLoginAsync(user, info);
                return (user, null, null, null, null, false);
            }
        }

        // User does not exist. Needs profile completion.
        return (null, info.LoginProvider, info.ProviderKey, email, name, true);
    }
}
