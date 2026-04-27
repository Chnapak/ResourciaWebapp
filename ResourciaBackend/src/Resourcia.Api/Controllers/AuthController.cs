using Microsoft.AspNetCore.Authentication;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Identity.Data;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.ModelBinding;
using Microsoft.AspNetCore.RateLimiting;
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
    private readonly ExternalAuthService _externalAuthService;

    public AuthController(
        IClock clock,
        AppDbContext dbContext,
        UserManager<AppUser> userManager,
        SignInManager<AppUser> signInManager,
        EmailSenderService emailSenderService,
        CaptchaService captchaService,
        IOptions<JwtSettings> options,
        IOptions<EnvironmentOptions> environmentSettings,
        ExternalAuthService externalAuthService)
    {
        _clock = clock;
        _dbContext = dbContext;
        _signInManager = signInManager;
        _userManager = userManager;
        _jwtSettings = options.Value;
        _emailSenderService = emailSenderService;
        _captchaService = captchaService;
        _environmentSettings = environmentSettings.Value;
        _externalAuthService = externalAuthService;
    }

    // We will also add verion of endpoint into post controller
    [HttpPost("Register")]
    [EnableRateLimiting("auth")]
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

        await GenerateEmailConfirmation(newUser);
        
        return NoContent();
    }

    [HttpPost("ResendEmail")]
    [EnableRateLimiting("auth")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    public async Task<ActionResult> ResendEmail([FromBody] ResendEmailModel emailModel)
    {
        const string responseMessage =
            "If an account exists for that email, a confirmation message will be sent shortly.";

        if (string.IsNullOrWhiteSpace(emailModel.Email))
        {
            return Ok(new { message = responseMessage });
        }

        var normalizedMail = emailModel.Email.Trim().ToUpperInvariant();
        var user = await _userManager.Users.SingleOrDefaultAsync(x => x.NormalizedEmail == normalizedMail);

        if (user == null || user.EmailConfirmed)
        {
            return Ok(new { message = responseMessage });
        }

        var hasPendingEmail = await _dbContext.Emails.AnyAsync(x => !x.Sent && x.RecipientEmail == user.Email);
        if (hasPendingEmail)
        {
            return Ok(new { message = responseMessage });
        }

        await GenerateEmailConfirmation(user);

        return Ok(new { message = responseMessage });
    }

    /// <summary>
    /// unescape token before sending
    /// </summary>
    /// <param name="model"></param>
    /// <returns></returns>
    [HttpPost("ValidateToken")]
    [EnableRateLimiting("auth")]
    [ProducesResponseType(StatusCodes.Status200OK)]
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

        var roles = await _userManager.GetRolesAsync(user);
        var accessToken = GenerateAccessToken(user.Id, user.Email!, user.DisplayName!, roles, _jwtSettings.AccessTokenExpirationInMinutes);
        var refreshToken = await GenerateRefreshTokenAsync(user.Id, _jwtSettings.RefreshTokenExpirationInDays);

        Response.Cookies.Append("AccessToken", accessToken, BuildAccessTokenCookieOptions());
        Response.Cookies.Append("RefreshToken", refreshToken, BuildRefreshTokenCookieOptions());

        return Ok();
    }

    [HttpPost("Login")]
    [EnableRateLimiting("auth")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public async Task<ActionResult> Login([FromBody] LoginModel model)
    {
        var email = model.Email.Trim();
        var normalizedEmail = email.ToUpperInvariant();
        var user = await _userManager
            .Users
            .SingleOrDefaultAsync(x => x.NormalizedEmail == normalizedEmail);

        if (user == null)
        {
            ModelState.AddModelError(string.Empty, "LOGIN_FAILED");
            return ValidationProblem(ModelState);
        }

        if (!user.EmailConfirmed)
        {
            ModelState.AddModelError<LoginModel>(x => x.Email, "EMAIL_NOT_CONFIRMED");
            return ValidationProblem(ModelState);
        }

        var signInResult = await _signInManager.PasswordSignInAsync(user, model.Password, false, true);

        if (signInResult.IsLockedOut)
        {
            var lockoutEnd = user.LockoutEnd;
            Instant? lockoutInstant = null;

            if (lockoutEnd.HasValue)
            {
                lockoutInstant = Instant.FromDateTimeOffset(lockoutEnd.Value);
            }

            return Unauthorized(new
            {
                error = "USER_LOCKED_OUT",
                until = lockoutInstant?.ToString(),
                reason = user.ModerationReason
            });
        }

        if (!signInResult.Succeeded)
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
        var accessToken = GenerateAccessToken(user.Id, user.Email!, user.DisplayName!, roles, _jwtSettings.AccessTokenExpirationInMinutes);
        var refreshToken = await GenerateRefreshTokenAsync(user.Id, _jwtSettings.RefreshTokenExpirationInDays);
        Response.Cookies.Append("AccessToken", accessToken, BuildAccessTokenCookieOptions());
        Response.Cookies.Append("RefreshToken", refreshToken, BuildRefreshTokenCookieOptions());
        return Ok();
    }

    [HttpGet("ExternalLogin")]
    [EnableRateLimiting("auth")]
    public IActionResult ExternalLogin([FromQuery] string provider, [FromQuery] string? returnUrl = null)
    {
        var loginProvider = _externalAuthService.NormalizeProvider(provider);
        if (loginProvider == null)
        {
            return BadRequest(new { message = "Unsupported external login provider." });
        }

        var safeReturnUrl = NormalizeFrontendReturnUrl(returnUrl);
        var callbackPath = Url.Action(nameof(ExternalLoginCallback), "Auth", new { returnUrl = safeReturnUrl });
        if (string.IsNullOrWhiteSpace(callbackPath))
        {
            return StatusCode(StatusCodes.Status500InternalServerError);
        }

        var callbackUrl = $"{_environmentSettings.FrontendHostUrl.TrimEnd('/')}{callbackPath}";
        var properties = _signInManager.ConfigureExternalAuthenticationProperties(loginProvider, callbackUrl);

        return Challenge(properties, loginProvider);
    }

    [HttpGet("ExternalLoginCallback")]
    [EnableRateLimiting("auth")]
    public async Task<IActionResult> ExternalLoginCallback([FromQuery] string? returnUrl = null)
    {
        var safeReturnUrl = NormalizeFrontendReturnUrl(returnUrl);
        var info = await _signInManager.GetExternalLoginInfoAsync();
        if (info == null)
        {
            return Redirect(BuildFrontendLoginErrorRedirect("external_login_failed"));
        }

        var externalLogin = await _externalAuthService.HandleCallbackAsync(info);
        await HttpContext.SignOutAsync(IdentityConstants.ExternalScheme);

        if (externalLogin.Status == ExternalLoginCallbackStatus.SignedIn && externalLogin.User != null)
        {
            if (externalLogin.User.DeletedAt != null)
            {
                return Redirect(BuildFrontendLoginErrorRedirect("deactivated_account"));
            }

            await SignInWithJwtCookiesAsync(externalLogin.User);
            return Redirect(BuildFrontendUrl(safeReturnUrl));
        }

        if (externalLogin.Status == ExternalLoginCallbackStatus.NeedsProfile
            && !string.IsNullOrWhiteSpace(externalLogin.RegistrationToken))
        {
            var completeProfilePath = NormalizeFrontendReturnUrl(_environmentSettings.CompleteProfileUrl);
            var redirectUrl =
                $"{BuildFrontendUrl(completeProfilePath)}?registrationToken={Uri.EscapeDataString(externalLogin.RegistrationToken)}";

            return Redirect(redirectUrl);
        }

        return Redirect(BuildFrontendLoginErrorRedirect(externalLogin.ErrorCode ?? "external_login_failed"));
    }

    [HttpPost("CompleteExternalLogin")]
    [EnableRateLimiting("auth")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public async Task<ActionResult> CompleteExternalLogin([FromBody] CompleteExternalLoginModel model)
    {
        var result = await _externalAuthService.CompleteExternalLoginAsync(model);
        if (result.Status == CompleteExternalLoginStatus.ValidationFailed || result.User == null)
        {
            AddExternalAuthErrorsToModelState(result.Errors);
            return ValidationProblem(ModelState);
        }

        await SignInWithJwtCookiesAsync(result.User);
        return Ok();
    }

    [HttpPost("ForgotPassword")]
    [EnableRateLimiting("auth")]
    public async Task<ActionResult> ForgotPassword([FromBody] ForgotPasswordModel model)
    {
        var normalizedEmail = model.Email.ToUpperInvariant();
        var user = await _userManager
            .Users
            .SingleOrDefaultAsync(x => x.NormalizedEmail == normalizedEmail);
        if (user == null || !user.EmailConfirmed)
        {
            return Ok();
        }
        var token = await _userManager.GeneratePasswordResetTokenAsync(user);
        var url = $"{_environmentSettings.FrontendHostUrl.TrimEnd('/')}/{_environmentSettings.FrontendResetPasswordUrl.TrimStart('/')}";
        var escapedToken = Uri.EscapeDataString(token);
        await _emailSenderService.AddEmail("Password Reset", $"You can reset your password by clicking <a href='{url}/?token={escapedToken}&email={user.Email}'>here</a>", user.Email, user.DisplayName);
        return Ok();
    }

    [HttpPost("ResetPassword")]
    [EnableRateLimiting("auth")]
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

        Response.Cookies.Append("AccessToken", newAccessToken, BuildAccessTokenCookieOptions());
        Response.Cookies.Append("RefreshToken", newRefreshToken, BuildRefreshTokenCookieOptions());
        return Ok();
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
        Response.Cookies.Delete("AccessToken");
        return NoContent();
    }


    [Authorize]
    [HttpGet("TestMeBeforeLoginAndAfter")]
    public ActionResult TestMeBeforeLoginAndAfter()
    {
        return Ok("Succesfully reached endpoint!");
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

    private async Task SignInWithJwtCookiesAsync(AppUser user)
    {
        var roles = await _userManager.GetRolesAsync(user);
        var accessToken = GenerateAccessToken(user.Id, user.Email!, user.DisplayName!, roles, _jwtSettings.AccessTokenExpirationInMinutes);
        var refreshToken = await GenerateRefreshTokenAsync(user.Id, _jwtSettings.RefreshTokenExpirationInDays);

        Response.Cookies.Append("AccessToken", accessToken, BuildAccessTokenCookieOptions());
        Response.Cookies.Append("RefreshToken", refreshToken, BuildRefreshTokenCookieOptions());
    }

    private static string NormalizeFrontendReturnUrl(string? returnUrl)
    {
        if (string.IsNullOrWhiteSpace(returnUrl) || !returnUrl.StartsWith('/'))
        {
            return "/";
        }

        return returnUrl.StartsWith("//") ? "/" : returnUrl;
    }

    private string BuildFrontendUrl(string path)
    {
        var normalizedPath = NormalizeFrontendReturnUrl(path);
        return $"{_environmentSettings.FrontendHostUrl.TrimEnd('/')}{normalizedPath}";
    }

    private string BuildFrontendLoginErrorRedirect(string error)
        => $"{BuildFrontendUrl("/login")}?externalLoginError={Uri.EscapeDataString(error)}";

    private void AddExternalAuthErrorsToModelState(IReadOnlyDictionary<string, string[]>? errors)
    {
        if (errors == null || errors.Count == 0)
        {
            ModelState.AddModelError(string.Empty, "EXTERNAL_LOGIN_FAILED");
            return;
        }

        foreach (var errorGroup in errors)
        {
            foreach (var error in errorGroup.Value)
            {
                ModelState.AddModelError(errorGroup.Key, error);
            }
        }
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

    private CookieOptions BuildRefreshTokenCookieOptions()
    {
        return new CookieOptions
        {
            HttpOnly = true,
            Secure = true,
            SameSite = SameSiteMode.Strict,
            Expires = DateTime.UtcNow.AddDays(_jwtSettings.RefreshTokenExpirationInDays)
        };
    }

    private CookieOptions BuildAccessTokenCookieOptions()
    {
        return new CookieOptions
        {
            HttpOnly = true,
            Secure = true,
            SameSite = SameSiteMode.Strict,
            Expires = DateTime.UtcNow.AddMinutes(_jwtSettings.AccessTokenExpirationInMinutes)
        };
    }

    public static string Hash(string token)
    {
        var bytes = Encoding.UTF8.GetBytes(token);
        var hash = SHA256.HashData(bytes);
        return Convert.ToBase64String(hash);

    }

    [HttpGet("TestMail")]
    [Authorize(Roles = "Admin")]
    public async Task<ActionResult> Test(
    [FromServices] EmailSenderService service
    )
    {
        await _emailSenderService.AddEmail("Suuuubject", "Aaaaaaaaaaa", "test@test.cz");
        return NoContent();
    }
}
