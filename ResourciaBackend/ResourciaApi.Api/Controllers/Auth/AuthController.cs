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
using System.IdentityModel.Tokens.Jwt;
using System.Net.Http.Headers;
using System.Security.Claims;
using System.Security.Cryptography;
using System.Text;
using TwitterEdu.Api.Models.Auth;
using TwitterEdu.Api.Utils;


namespace Resourcia.Api.Controllers.Auth;

[ApiController]
[Route("api/[controller]")]
public class AuthController : ControllerBase
{
    private readonly IClock _clock;
    private readonly AppDbContext _dbContext;
    private readonly UserManager<AppUser> _userManager;
    private readonly SignInManager<AppUser> _signInManager;
    private readonly APIService _apiService;
    private readonly EmailSenderService _emailSenderService;
    private readonly JwtSettings _jwtSettings;
    private readonly EnvironmentOptions _envSettings;

    public AuthController(
        AppDbContext dbContext,
        IClock clock,
        UserManager<AppUser> userManager,
        SignInManager<AppUser> signInManager,
        APIService apiService,
        EmailSenderService emailSenderService,
        IOptions<JwtSettings> options,
        IOptions<EnvironmentOptions> envSettings // I believe there is something wrong, if you remove the IOptions<EnvironmentOptions> envSettings and put EnvironmentOptions envSettings, it will not work
                                                 // TODO: Check why it wouldn't work
        )
    {
        _dbContext = dbContext;
        _clock = clock;
        _userManager = userManager;
        _signInManager = signInManager;
        _apiService = apiService;
        _emailSenderService = emailSenderService;
        _jwtSettings = options.Value;
        _envSettings = envSettings.Value;
    }


    [HttpPost("Register")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public async Task<ActionResult> Register([FromBody] RegisterModel model)
    {
        var ipAddress = HttpContext.Connection.RemoteIpAddress?.ToString();

        var captchaVerificationResult = await _apiService.VerifyCaptchaAsync(model.CaptchaToken, ipAddress!);

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

        if (!ModelState.IsValid)
        {
            return ValidationProblem(ModelState);
        }

        var now = _clock.GetCurrentInstant();
        var passValidator = new PasswordValidator<AppUser>();

        var newUser = new AppUser
        {
            Id = Guid.NewGuid(),
            DisplayName = model.DisplayName,
            Email = model.Email,
            UserName = model.Email
        }.SetCreateBySystem(now);

        var checkPass = await passValidator.ValidateAsync(_userManager, newUser, model.Password);

        if (!checkPass.Succeeded)
        {
            ModelState.AddModelError<RegisterModel>(x => x.Password, string.Join("\n", checkPass.Errors.Select(x => x.Description)));
            return ValidationProblem(ModelState);
        }

        await _userManager.CreateAsync(newUser);
        await _userManager.AddPasswordAsync(newUser, model.Password);

        var token = await _userManager.GenerateEmailConfirmationTokenAsync(newUser);
        Console.WriteLine(token);

        var url = $"{_envSettings.FrontendHostUrl.TrimEnd('/')}/{_envSettings.FrontendConfirmUrl.TrimStart('/')}";
        var escapedToken = Uri.EscapeDataString(token);
        await _emailSenderService.AddEmail("Registration", $"Please confirm your email by clicking <a href='{url}/?token={escapedToken}&email={newUser.Email}'>here</a>", model.Email, model.DisplayName);

        return Ok(new { token });
    }

    [HttpPost("ResendEmail")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)] 
    public async Task<ActionResult> ResendEmail([FromBody] ResendConfirmationModel emailModel)
    {
        var normalizedMail = emailModel.Email?.Trim().ToUpperInvariant();
        var user = await _userManager.Users.SingleOrDefaultAsync(x => x.NormalizedEmail == normalizedMail);

        if (user == null)
        {
            return BadRequest(new { message = "User not found."});
        }
        else if (user.EmailConfirmed)
        {
            return BadRequest(new { message = "Email is already confirmed."});
        }

        var token = await _userManager.GenerateEmailConfirmationTokenAsync(user);
        Console.WriteLine(token);

        var url = $"{_envSettings.FrontendHostUrl.TrimEnd('/')}/{_envSettings.FrontendConfirmUrl.TrimStart('/')}";
        var escapedToken = Uri.EscapeDataString(token);
        await _emailSenderService.AddEmail("Registration", $"Please confirm your email by clicking <a href='{url}/?token={escapedToken}&email={user.Email}'>here</a>", user.Email, user.DisplayName);

        return Ok(new { message = "Confirmation email has been resent."});
    }

    [HttpGet("api/ping")]
    public string GetPong()
    {
        return "pong";
    }

    [HttpPost("ValidateToken")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public async Task<ActionResult> ValidateToken([FromBody] TokenModel userToken)
    {
        var normalizedMail = userToken.Email?.Trim().ToUpperInvariant();
        var user = await _userManager.Users.SingleOrDefaultAsync(x => !x.EmailConfirmed && x.NormalizedEmail == normalizedMail);
        if (user == null)
        {
            return NotFound(new { message = "User not found" });
        }
        var result = await _userManager.ConfirmEmailAsync(user, userToken.Token);
        if (!result.Succeeded)
        {
            return BadRequest(new { message = "Invalid token" });
        }
        return NoContent();
    }

    [HttpPost("Login")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public async Task<ActionResult> Login([FromBody] LoginModel login)
    {
        var normalizedMail = login.Email?.Trim().ToUpperInvariant();
        var user = await _userManager.Users.SingleOrDefaultAsync(x => x.EmailConfirmed && x.NormalizedEmail == normalizedMail);
        
        if (user == null)
        {
            ModelState.AddModelError(string.Empty, "LOGIN_FAILED");
            return ValidationProblem(ModelState);
        }

        var result = await _signInManager.CheckPasswordSignInAsync(user, login.Password, lockoutOnFailure: true);
        if (!result.Succeeded)
        {
            ModelState.AddModelError(string.Empty, "LOGIN_FAILED");
            return ValidationProblem(ModelState);
        }

        var accessToken = GenerateAccessToken(user.Id, login.Email, user.UserName!, _jwtSettings.AccessTokenExpirationInMinutes);
        var refreshToken = await GenereateRefreshTokenAsync(user.Id, _jwtSettings.RefreshTokenExpirationInDays);
        Response.Cookies.Append("RefreshToken", refreshToken, new CookieOptions
        {
            HttpOnly = true,
            Secure = false, // V případě HTTPS místo HTTP
            SameSite = SameSiteMode.Strict,
            Expires = DateTime.UtcNow.AddDays(_jwtSettings.RefreshTokenExpirationInDays)
        });

        return Ok(new { Token = accessToken });
    }

    [HttpPost("RefreshToken")]
    public async Task<ActionResult> RefreshToken()
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
        var newAccessToken = GenerateAccessToken(user.Id, user.Email!, user.UserName!, _jwtSettings.AccessTokenExpirationInMinutes);
        var newRefreshToken = await GenereateRefreshTokenAsync(user.Id, _jwtSettings.RefreshTokenExpirationInDays);

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
                id = default,
                name = null,
                isAuthenticated = false,
                isAdmin = false,
            };
        }
            
        var id = User.GetUserId();
        var user = await _userManager.Users
            .Where(x => x.Id == id)
            .AsNoTracking()
            .SingleAsync();

        var loggedModel = new LoggedUserModel
        {
            id = user.Id,
            name = user.DisplayName,
            isAuthenticated = true,
            isAdmin = false,
        };

        return Ok(loggedModel);
    }

    private async Task<string> GenereateRefreshTokenAsync(Guid userId, int refreshTokenExpirationInDays)
    {
        var refreshToken = Guid.NewGuid().ToString();
        var data = Request.Headers.UserAgent.ToString();

        var now = _clock.GetCurrentInstant();
        _dbContext.Add(new RefreshToken
        {
            UserId = userId,
            Token = Hash(refreshToken),
            CreatedAt = now,
            ExpiresAt = now.Plus(Duration.FromDays(refreshTokenExpirationInDays)),
            RequestInfo = data
        });
        await _dbContext.SaveChangesAsync();
        return refreshToken;
    }

    private string GenerateAccessToken(Guid userId, string email, string username, int accessTokenExpirationInMinutes)
    {
        var claims = new List<Claim>
        {
            new (JwtRegisteredClaimNames.Sub, userId.ToString().ToLowerInvariant()),
            new (JwtRegisteredClaimNames.Email, email),
            new (JwtRegisteredClaimNames.UniqueName, username)
        };

        var key = new SymmetricSecurityKey(System.Text.Encoding.UTF8.GetBytes(_jwtSettings.SecretKey));
        Console.WriteLine($"SecretKey: '{_jwtSettings.SecretKey}'");

        var creds = new SigningCredentials(key, SecurityAlgorithms.HmacSha256);
        var token = new JwtSecurityToken(
            issuer: _jwtSettings.Issuer,
            audience: _jwtSettings.Audience,
            claims: claims,
            expires: DateTime.UtcNow.AddMinutes(accessTokenExpirationInMinutes),
            signingCredentials: creds
        );

        return new JwtSecurityTokenHandler().WriteToken(token);
    }

    public static string Hash(string refreshToken)
    {
        var bytes = Encoding.UTF8.GetBytes(refreshToken);
        var hash = SHA256.HashData(bytes);
        return Convert.ToBase64String(hash);
    }
}
