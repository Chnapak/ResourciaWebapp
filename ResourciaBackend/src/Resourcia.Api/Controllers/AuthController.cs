using Microsoft.AspNetCore.Authentication;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Identity.Data;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.ModelBinding;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Options;
using Microsoft.IdentityModel.Tokens;
using NodaTime;
using Resourcia.Api.Models.Auth;
using Resourcia.Api.Options;
using Resourcia.Api.Services;
using Resourcia.Api.Utils;
using Resourcia.Data;
using Resourcia.Data.Entities.Identity;
using Resourcia.Data.Interfaces;
using System.Data;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Security.Cryptography;
using System.Text;

namespace Resourcia.Api.Controllers;
[ApiController]
[Route("api/[controller]")]
public class AuthController : ControllerBase
{
    private readonly IClock _clock;
    private readonly AppDbContext _dbContext;
    private readonly UserManager<AppUser> _userManager;
    private readonly SignInManager<AppUser> _signInManager;
    private readonly JwtSettings _jwtSettings;
    private readonly EnvironmentOptions _environmentSettings;
    private readonly CaptchaService _captchaService;
    private readonly EmailSenderService _emailSenderService;
    private readonly OAuthService _oAuthService;

    public AuthController(
        IClock clock,
        AppDbContext dbContext,
        UserManager<AppUser> userManager,
        SignInManager<AppUser> signInManager,
        EmailSenderService emailSenderService,
        CaptchaService captchaService,
        IOptions<JwtSettings> options,
        IOptions<EnvironmentOptions> environmentSettings,
        OAuthService oAuthService)
    {
        _clock = clock;
        _dbContext = dbContext;
        _signInManager = signInManager;
        _userManager = userManager;
        _jwtSettings = options.Value;
        _emailSenderService = emailSenderService;
        _captchaService = captchaService;
        _environmentSettings = environmentSettings.Value;
        _oAuthService = oAuthService;
    }

    // We will also add verion of endpoint into post controller
    [HttpPost("Register")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public async Task<ActionResult> Register(
       [FromBody] RegisterModel model
       )
    {
        var ipAddress = HttpContext.Connection.RemoteIpAddress?.ToString();

        var captchaVerificationResult = await _captchaService.VerifyCaptchaAsync(model.CaptchaToken, ipAddress!);

        if (!captchaVerificationResult)
        {
            ModelState.AddModelError(string.Empty, "CAPTCHA_VERIFICATION_FAILED");
            return ValidationProblem(ModelState);
        }

        var existingEmailUser = await _userManager.FindByEmailAsync(model.Email);
        if (existingEmailUser != null)
        {
            ModelState.AddModelError<RegisterModel>(x => x.Email, "EMAIL_ALREADY_IN_USE");
        }

        var existingUsernameUser = await _userManager.Users.FirstOrDefaultAsync(x => x.DisplayName == model.DisplayName);
        if (existingUsernameUser != null)
        {
            ModelState.AddModelError<RegisterModel>(x => x.DisplayName, "USERNAME_ALREADY_IN_USE");
        }

        var requestedHandle = ProfileHandleUtility.BuildHandle(model.DisplayName);
        var existingHandleUser = await _userManager.Users.FirstOrDefaultAsync(x => x.Handle == requestedHandle);
        if (existingHandleUser != null)
        {
            ModelState.AddModelError<RegisterModel>(x => x.DisplayName, "USERNAME_ALREADY_IN_USE");
        }

        if (!ModelState.IsValid)
        {
            return ValidationProblem(ModelState);
        }

        var passValidator = new PasswordValidator<AppUser>();
        var now = _clock.GetCurrentInstant();

        var newUser = new AppUser
        {
            Id = Guid.NewGuid(),
            DisplayName = model.DisplayName,
            Handle = requestedHandle,
            Email = model.Email,
            UserName = model.Email,
        }.SetCreateBySystem(now);

        var checkPassword = await passValidator.ValidateAsync(_userManager, newUser, model.Password);

        if (!checkPassword.Succeeded)
        {
            ModelState.AddModelError<RegisterModel>(
                x => x.Password, string.Join("\n", checkPassword.Errors.Select(x => x.Description)));
            return ValidationProblem(ModelState);
        }

        // Method with SaveChanges()!
        await _userManager.CreateAsync(newUser);
        // Method with SaveChanges()!
        await _userManager.AddPasswordAsync(newUser, model.Password);

        var token = await GenerateEmailConfirmation(newUser);
        
        return Ok(new { token });
    }

    [HttpPost("ResendEmail")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public async Task<ActionResult> ResendEmail([FromBody] ResendEmailModel emailModel)
    {
        var normalizedMail = emailModel.Email?.Trim().ToUpperInvariant();
        var user = await _userManager.Users.SingleOrDefaultAsync(x => x.NormalizedEmail == normalizedMail);

        if (user == null)
        {
            return BadRequest(new { message = "User not found." });
        }
        else if (user.EmailConfirmed)
        {
            return BadRequest(new { message = "Email is already confirmed." });
        }

        var unsentEmails = await _dbContext.Emails.SingleOrDefaultAsync(x => !x.Sent && x.RecipientEmail == user.Email);

        if (unsentEmails != null)
        {
            return Ok(new { message = "Original email is still waiting to be sent." , token = string.Empty});
        }

        var email = await _dbContext.Emails.SingleOrDefaultAsync(x => x.RecipientEmail == user.Email);
        string? tokenEmailed = null;
        if (email == null)
        {
            tokenEmailed = await GenerateEmailConfirmation(user);
            return Ok(new { message = "No email to be resent, created a new one.", token = tokenEmailed});
        }

        await _emailSenderService.AddEmail(email.Body, user.Email, user.DisplayName);

        return Ok(new { message = "Confirmation email has been resent.", token = string.Empty });
    }

    /// <summary>
    /// unescape token before sending
    /// </summary>
    /// <param name="model"></param>
    /// <returns></returns>
    [HttpPost("ValidateToken")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public async Task<ActionResult> ValidateToken(
        [FromBody] TokenModel userTokenModel
        )
    {
        var normalizedMail = userTokenModel.Email.ToUpperInvariant();
        var user = await _userManager
            .Users
            .SingleOrDefaultAsync(x => !x.EmailConfirmed && x.NormalizedEmail == normalizedMail);

        if (user == null)
        {
            ModelState.AddModelError<TokenModel>(x => x.Token, "INVALID_TOKEN");
            return ValidationProblem(ModelState);
        }

        var check = await _userManager.ConfirmEmailAsync(user, userTokenModel.Token);
        if (!check.Succeeded)
        {
            ModelState.AddModelError<TokenModel>(x => x.Token, "INVALID_TOKEN");
            return ValidationProblem(ModelState);
        }

        return NoContent();
    }

    [HttpPost("Login")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public async Task<ActionResult> Login([FromBody] LoginModel model)
    {
        var normalizedEmail = model.Email.ToUpperInvariant();
        var user = await _userManager
            .Users
            .SingleOrDefaultAsync(x => x.EmailConfirmed && x.NormalizedEmail == normalizedEmail);

        if (user == null)
        {
            ModelState.AddModelError(string.Empty, "LOGIN_FAILED");
            return ValidationProblem(ModelState);
        }

        var signInResult = await _userManager.CheckPasswordAsync(user, model.Password);


        if (await _userManager.IsLockedOutAsync(user) && signInResult)
        {
            var lockoutEnd = user.LockoutEnd;

            Instant? lockoutInstant = null;

            if (lockoutEnd.HasValue)
            {
                lockoutInstant = Instant.FromDateTimeOffset(lockoutEnd.Value);
            }
            Console.WriteLine("Test");
            return Unauthorized(new
            {
                error = "USER_LOCKED_OUT",
                until = lockoutInstant?.ToString(),
                reason = user.ModerationReason
            });
        }


        if (!signInResult)
        {
            ModelState.AddModelError(string.Empty, "LOGIN_FAILED");
            return ValidationProblem(ModelState);
        }

        if (user.DeletedAt != null)
        {
            ModelState.AddModelError(string.Empty, "DEACTIVATED_ACCOUNT");
            return Unauthorized(ModelState);
        }

        var roles = await _userManager.GetRolesAsync(user);
        var accessToken = GenerateAccessToken(user.Id, model.Email, user.DisplayName!, roles, _jwtSettings.AccessTokenExpirationInMinutes);
        var refreshToken = await GenerateRefreshTokenAsync(user.Id, _jwtSettings.RefreshTokenExpirationInDays);
        Response.Cookies.Append("RefreshToken", refreshToken, new CookieOptions
        {
            HttpOnly = true,
            Secure = false, // For HTTPS
            SameSite = SameSiteMode.Strict,
            Expires = DateTime.UtcNow.AddDays(_jwtSettings.RefreshTokenExpirationInDays)
        });
        return Ok(new { Token = accessToken });
    }

    [HttpPost("ForgotPassword")]
    public async Task<ActionResult> ForgotPassword([FromBody] ForgotPasswordModel model)
    {
        var normalizedEmail = model.Email.ToUpperInvariant();
        var user = await _userManager
            .Users
            .SingleOrDefaultAsync(x => x.NormalizedEmail == normalizedEmail);
        if (user == null || !user.EmailConfirmed)
        {
            return BadRequest("Email invalid");
        }
        var token = await _userManager.GeneratePasswordResetTokenAsync(user);
        var url = $"{_environmentSettings.FrontendHostUrl.TrimEnd('/')}/{_environmentSettings.FrontendResetPasswordUrl.TrimStart('/')}";
        var escapedToken = Uri.EscapeDataString(token);
        await _emailSenderService.AddEmail("Password Reset", $"You can reset your password by clicking <a href='{url}/?token={escapedToken}&email={user.Email}'>here</a>", user.Email, user.DisplayName);
        return Ok();
    }

    [HttpPost("ResetPassword")]
    public async Task<ActionResult> ResetPassword([FromBody] ResetPasswordModel model)
    {
        var normalizedEmail = model.Email.ToUpperInvariant();
        var user = await _userManager
            .Users
            .SingleOrDefaultAsync(x => x.NormalizedEmail == normalizedEmail);
        if (user == null || !user.EmailConfirmed)
        {
            return BadRequest("Email invalid");
        }
        var result = await _userManager.ResetPasswordAsync(user, model.Token, model.NewPassword);
        if (!result.Succeeded)
        {
            return BadRequest("Token invalid or password does not meet requirements");
        }
        return Ok();    
    }

    [HttpPost("RefreshToken")]
    public async Task<IActionResult> RefreshToken()
    {
        if (!Request.Cookies.TryGetValue("RefreshToken", out var incomingToken))
        {
            return Unauthorized(new { Message = "Refresh token not found" });
        }

        var hashedToken = Hash(incomingToken);

        var storedToken = await _dbContext.RefreshTokens
            .FirstOrDefaultAsync(t => t.Token == hashedToken);

        if (storedToken == null || storedToken.ExpiresAt < _clock.GetCurrentInstant() || storedToken.RevokedAt != null)
        {
            return Unauthorized(new { Message = "Invalid or expired refresh token" });
        }

        // Generate new access and refresh tokens
        var user = await _dbContext.Users.FindAsync(storedToken.UserId);
        if (user == null)
        {
            return Unauthorized();
        }

        // Generate new tokens
        var roles = await _userManager.GetRolesAsync(user);
        var newAccessToken = GenerateAccessToken(user.Id, user.Email!, user.DisplayName!, roles, _jwtSettings.AccessTokenExpirationInMinutes);
        var newRefreshToken = await GenerateRefreshTokenAsync(user.Id, _jwtSettings.RefreshTokenExpirationInDays);

        storedToken.RevokedAt = _clock.GetCurrentInstant();
        await _dbContext.SaveChangesAsync();

        Response.Cookies.Append("RefreshToken", newRefreshToken, new CookieOptions
        {
            HttpOnly = true,
            Secure = false, // For HTTPS
            SameSite = SameSiteMode.Strict,
            Expires = DateTime.UtcNow.AddDays(_jwtSettings.RefreshTokenExpirationInDays)
        });
        return Ok(new
        {
            Token = newAccessToken,
        });
    }

    [Authorize]
    [HttpGet("UserInfo")]
    public async Task<ActionResult<LoggedUserModel>> GetUserInfo()
    {
        if (!User.Identities.Any(x => x.IsAuthenticated))
        {
            return new LoggedUserModel
            {
                Id = default,
                Name = null,
                IsAuthenticated = false,
                IsAdmin = false,
            };
        }

        var id = User.GetUserId();
        var user = await _userManager.Users
            .Where(x => x.Id == id)
            .AsNoTracking()
            .SingleAsync();

        var userRoles = await _userManager.GetRolesAsync(user);

        var loggedModel = new LoggedUserModel
        {
            Id = user.Id,
            Name = user.DisplayName,
            IsAuthenticated = true,
            IsAdmin = (userRoles.Contains("Admin")) ? true : false,
        };

        return Ok(loggedModel);
    }

    [Authorize]
    [HttpPost("Logout")]
    public async Task<ActionResult> Logout()
    {
        if (!Request.Cookies.TryGetValue("RefreshToken", out var incomingToken))
        {
            return NoContent();
        }

        var hashedToken = Hash(incomingToken);

        var storedToken = await _dbContext.RefreshTokens
            .FirstOrDefaultAsync(t => t.Token == hashedToken);

        if (storedToken == null || storedToken.ExpiresAt < _clock.GetCurrentInstant() || storedToken.RevokedAt != null)
        {
            return NoContent();
        }

        storedToken.ExpiresAt = _clock.GetCurrentInstant();
        await _dbContext.SaveChangesAsync();

        Response.Cookies.Delete("RefreshToken");
        return NoContent();
    }


    [Authorize]
    [HttpGet("TestMeBeforeLoginAndAfter")]
    public ActionResult TestMeBeforeLoginAndAfter()
    {
        return Ok("Succesfully reached endpoint!");
    }

    [HttpGet("ExternalLogin")]
    [AllowAnonymous]
    public IActionResult ExternalLogin([FromQuery] string provider, [FromQuery] string? returnUrl = null)
    {
        if (provider != "Google" && provider != "Facebook")
            return BadRequest(new { error = "Invalid provider" });

        var redirectUrl = Url.Action(nameof(ExternalLoginCallback), "Auth", new { returnUrl });
        var properties = _signInManager.ConfigureExternalAuthenticationProperties(provider, redirectUrl);
        return Challenge(properties, provider);
    }

    [HttpGet("ExternalLoginCallback")]
    [AllowAnonymous]
    public async Task<IActionResult> ExternalLoginCallback([FromQuery] string? returnUrl = null, [FromQuery] string? remoteError = null)
    {
        var frontendUrl = _environmentSettings.FrontendHostUrl.TrimEnd('/');

        if (remoteError != null)
            return Redirect($"{frontendUrl}?error={Uri.EscapeDataString(remoteError)}");

        var info = await _signInManager.GetExternalLoginInfoAsync();
        if (info == null)
            return Redirect($"{frontendUrl}?error={Uri.EscapeDataString("Error loading external login information.")}");

        // 1. Try to sign in the user if they are already linked
        var result = await _signInManager.ExternalLoginSignInAsync(info.LoginProvider, info.ProviderKey, isPersistent: false, bypassTwoFactor: true);

        if (result.Succeeded)
        {
            // User already has this Google account linked.
            var user = await _userManager.FindByLoginAsync(info.LoginProvider, info.ProviderKey);
            return await GenerateLoginRedirect(user!, returnUrl);
        }

        // 2. User is NOT linked. Check if the email already exists locally.
        var email = info.Principal.FindFirstValue(ClaimTypes.Email);
        if (!string.IsNullOrEmpty(email))
        {
            var existingUser = await _userManager.FindByEmailAsync(email);
            if (existingUser != null)
            {
                // MERGE HAPPENS HERE: Link the Google account to the existing email account
                var addLoginResult = await _userManager.AddLoginAsync(existingUser, info);
                if (addLoginResult.Succeeded)
                {
                    // Successfully merged! Log them in.
                    return await GenerateLoginRedirect(existingUser, returnUrl);
                }
            }
        }

        // 3. No existing account found. Fall back to your "Complete Profile" flow.
        var (newUser, provider, providerKey, userEmail, name, needsProfile) = await _oAuthService.HandleExternalLoginAsync(info);

        if (needsProfile)
        {
            var regClaims = new List<Claim>
        {
            new(JwtRegisteredClaimNames.Email, userEmail ?? string.Empty),
            new(ClaimTypes.Name, name ?? string.Empty),
            new("provider", provider!),
            new("providerKey", providerKey!),
            new(ClaimTypes.Role, "ExternalRegistration")
        };

            var key = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(_jwtSettings.SecretKey));
            var creds = new SigningCredentials(key, SecurityAlgorithms.HmacSha256);
            var tempToken = new JwtSecurityToken(
                issuer: _jwtSettings.Issuer,
                audience: _jwtSettings.Audience,
                claims: regClaims,
                expires: DateTime.Now.AddMinutes(30),
                signingCredentials: creds);

            // These variables must be defined here to be used in the Redirect below
            string tokenString = new JwtSecurityTokenHandler().WriteToken(tempToken);
            string completeUrl = $"{frontendUrl}/{_environmentSettings.CompleteProfileUrl.TrimStart('/')}";

            return Redirect($"{completeUrl}?registrationToken={tokenString}");
        }

        return await GenerateLoginRedirect(newUser!, returnUrl);
    }

    // Helper to keep code clean
    private async Task<IActionResult> GenerateLoginRedirect(AppUser user, string? returnUrl)
    {
        var roles = await _userManager.GetRolesAsync(user);
        var accessToken = GenerateAccessToken(user.Id, user.Email!, user.DisplayName!, roles, _jwtSettings.AccessTokenExpirationInMinutes);
        var refreshToken = await GenerateRefreshTokenAsync(user.Id, _jwtSettings.RefreshTokenExpirationInDays);

        Response.Cookies.Append("RefreshToken", refreshToken, new CookieOptions
        {
            HttpOnly = true,
            Secure = true, // Set to true for production
            SameSite = SameSiteMode.Strict,
            Expires = DateTime.UtcNow.AddDays(_jwtSettings.RefreshTokenExpirationInDays)
        });

        var finalUrl = returnUrl ?? _environmentSettings.FrontendHostUrl;
        return Redirect($"{finalUrl}?token={accessToken}");
    }

    [HttpPost("CompleteExternalLogin")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    public async Task<IActionResult> CompleteExternalLogin([FromBody] CompleteExternalLoginModel model)
    {
        if (!ModelState.IsValid)
            return ValidationProblem(ModelState);

        var tokenHandler = new JwtSecurityTokenHandler();
        var key = Encoding.UTF8.GetBytes(_jwtSettings.SecretKey);

        try
        {
            // ... (Existing Token Validation Logic) ...
            tokenHandler.ValidateToken(model.RegistrationToken, new TokenValidationParameters
            {
                ValidateIssuerSigningKey = true,
                IssuerSigningKey = new SymmetricSecurityKey(key), // This fixes IDX10500

                ValidateIssuer = true,
                ValidIssuer = _jwtSettings.Issuer,

                ValidateAudience = true,
                ValidAudience = _jwtSettings.Audience,

                ValidateLifetime = true,
                // Optional: Set to zero to avoid issues with server clock desync
                ClockSkew = TimeSpan.Zero
            }, out SecurityToken validatedToken);
            var jwt = (JwtSecurityToken)validatedToken;

            var email = jwt.Claims.FirstOrDefault(c => c.Type == JwtRegisteredClaimNames.Email)?.Value;
            var provider = jwt.Claims.FirstOrDefault(c => c.Type == "provider")?.Value;
            var providerKey = jwt.Claims.FirstOrDefault(c => c.Type == "providerKey")?.Value;
            var requestedHandle = ProfileHandleUtility.BuildHandle(model.DisplayName);

            var existingDisplayName = await _userManager.Users
                .AnyAsync(user => user.DisplayName == model.DisplayName);
            if (existingDisplayName)
            {
                ModelState.AddModelError(nameof(model.DisplayName), "USERNAME_ALREADY_IN_USE");
                return ValidationProblem(ModelState);
            }

            var existingHandle = await _userManager.Users
                .AnyAsync(user => user.Handle == requestedHandle);
            if (existingHandle)
            {
                ModelState.AddModelError(nameof(model.DisplayName), "USERNAME_ALREADY_IN_USE");
                return ValidationProblem(ModelState);
            }

            // 1. Create the User
            var now = _clock.GetCurrentInstant();
            var newUser = new AppUser
            {
                Id = Guid.NewGuid(),
                DisplayName = model.DisplayName,
                Handle = requestedHandle,
                Email = email,
                UserName = email,
                EmailConfirmed = true // External providers are pre-verified
            }.SetCreateBySystem(now);

            var createResult = await _userManager.CreateAsync(newUser);
            if (!createResult.Succeeded)
                return BadRequest(new { error = "Could not create user." });

            // 2. Link the External Provider
            var info = new ExternalLoginInfo(new ClaimsPrincipal(new ClaimsIdentity(jwt.Claims)), provider, providerKey, provider);
            await _userManager.AddLoginAsync(newUser, info);

            // 3. GENERATE AUTHENTICATION FOR FRONTEND
            var roles = await _userManager.GetRolesAsync(newUser);
            var accessToken = GenerateAccessToken(newUser.Id, newUser.Email!, newUser.DisplayName!, roles, _jwtSettings.AccessTokenExpirationInMinutes);
            var refreshToken = await GenerateRefreshTokenAsync(newUser.Id, _jwtSettings.RefreshTokenExpirationInDays);

            // 4. Set Refresh Token Cookie
            Response.Cookies.Append("RefreshToken", refreshToken, new CookieOptions
            {
                HttpOnly = true,
                Secure = true, // Set to true for Production (HTTPS)
                SameSite = SameSiteMode.Strict,
                Expires = DateTime.UtcNow.AddDays(_jwtSettings.RefreshTokenExpirationInDays)
            });

            // 5. Return the Access Token (JWT)
            return Ok(new { Token = accessToken });
        }
        catch (Exception ex)
        {
            Console.WriteLine(ex);
            return Unauthorized(new { error = "Invalid or expired registration token." + ex});
        }
    }

    private async Task<string> GenerateEmailConfirmation(AppUser newUser)
        {
        var token = string.Empty;
        token = await _userManager.GenerateEmailConfirmationTokenAsync(newUser);

        var url = $"{_environmentSettings.FrontendHostUrl.TrimEnd('/')}/{_environmentSettings.FrontendConfirmUrl.TrimStart('/')}";
        var escapedToken = Uri.EscapeDataString(token);
        await _emailSenderService.AddEmail("Registration", $"Please confirm your email by clicking <a href='{url}/?token={escapedToken}&email={newUser.Email}'>here</a>", newUser.Email, newUser.DisplayName);

        return token;
    }

    private async Task<string> GenerateRefreshTokenAsync(Guid userId, int expirationInDays)
    {
        var refreshToken = Guid.NewGuid().ToString();
        var data = Request.Headers.UserAgent.ToString();

        var now = _clock.GetCurrentInstant();
        _dbContext.Add(new RefreshToken
        {
            UserId = userId,
            Token = Hash(refreshToken),
            CreatedAt = now,
            ExpiresAt = now.Plus(Duration.FromDays(expirationInDays)),
            RequestInfo = data,
        });
        await _dbContext.SaveChangesAsync();
        return refreshToken;
    }

    private string GenerateAccessToken(Guid userId, string email, string username, IList<string> roles, int expirationInMinutes)
    {
        var claims = new List<Claim>
        {
            new(JwtRegisteredClaimNames.Sub, userId.ToString().ToLowerInvariant()),
            new(JwtRegisteredClaimNames.Email, email),
            new(JwtRegisteredClaimNames.Name, username),
        };
        claims.AddRange(roles.Select(role => new Claim(ClaimTypes.Role, role)));

        var key = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(_jwtSettings.SecretKey));
        var creds = new SigningCredentials(key, SecurityAlgorithms.HmacSha256);
        var token = new JwtSecurityToken(
            issuer: _jwtSettings.Issuer,
            audience: _jwtSettings.Audience,
            claims: claims,
            expires: DateTime.Now.AddMinutes(expirationInMinutes),
            signingCredentials: creds);

        return new JwtSecurityTokenHandler().WriteToken(token);
    }

    public static string Hash(string token)
    {
        var bytes = Encoding.UTF8.GetBytes(token);
        var hash = SHA256.HashData(bytes);
        return Convert.ToBase64String(hash);

    }

    [HttpGet("TestMail")]
    public async Task<ActionResult> Test(
    [FromServices] EmailSenderService service
    )
    {
        await _emailSenderService.AddEmail("Suuuubject", "Aaaaaaaaaaa", "test@test.cz");
        return NoContent();
    }
}
