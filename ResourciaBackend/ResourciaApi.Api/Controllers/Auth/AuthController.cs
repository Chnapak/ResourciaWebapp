using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.ModelBinding;
using Microsoft.Extensions.Options;
using NodaTime;
using Org.BouncyCastle.Utilities;
using Resourcia.Api.Models.Auth;
using Resourcia.Api.Options;
using Resourcia.Api.Services;
using Resourcia.Api.Utils;
using Resourcia.Data;
using Resourcia.Data.Entities.Identity;
using Resourcia.Data.Interfaces;
using System.ComponentModel.DataAnnotations;


namespace Resourcia.Api.Controllers.Auth;

[ApiController]
[Route("[controller]")]
public class AuthController : ControllerBase
{
    private readonly IClock _clock;
    private readonly AppDbContext _dbContext;
    private readonly UserManager<AppUser> _userManager;
    private readonly SignInManager<AppUser> _signInManager;
    private readonly EmailSenderService _emailSenderService;
    private readonly JwtSettings _jwtSettings;
    private readonly EnvironmentOptions _envSettings;

    public AuthController(
        AppDbContext dbContext,
        IClock clock,
        UserManager<AppUser> userManager,
        SignInManager<AppUser> signInManager,
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
        _emailSenderService = emailSenderService;
        _jwtSettings = options.Value;
        _envSettings = envSettings.Value;
    }


    [HttpPost("api/Register")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public async Task<ActionResult> Register([FromBody] RegisterModel model)
    {
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
            // TODO: Fix formatting
            ModelState.AddModelError<RegisterModel>(x => x.Password, string.Join("\n", checkPass.Errors.Select(x => x.Description)));
            return ValidationProblem(ModelState);
        }

        // Method with SaveChanges()!
        await _userManager.CreateAsync(newUser);
        // Method with SaveChanges()!
        await _userManager.AddPasswordAsync(newUser, model.Password);

        var token = string.Empty;
        token = await _userManager.GenerateEmailConfirmationTokenAsync(newUser);

        // Add something to do with urls and frontend.
        var url = Path.Combine(_envSettings.FrontendHostUrl, _envSettings.FrontendConfirmUrl);
        var escapedToken = Uri.EscapeDataString(token);
        await _emailSenderService.AddEmail("Registration", $"Please confirm your email by clicking <a href='{url}/confirm-email?token={escapedToken}&email={newUser.Email}'>here</a>", model.Email, model.DisplayName);

        return Ok(token);
    }

    [HttpGet("api/ping")]
    public string GetPong()
    {
        return "pong";
    }

    // TODO: Implement the register/login endpoint
    [HttpPost(Name = "Login")]
    public async Task<ActionResult> Login()
    {
        await Task.CompletedTask;
        throw new NotImplementedException();
    }
}
