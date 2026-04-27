using Microsoft.AspNetCore.Authentication;
using Microsoft.AspNetCore.DataProtection;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using NodaTime;
using Resourcia.Api.Models.Auth;
using Resourcia.Api.Utils;
using Resourcia.Data;
using Resourcia.Data.Entities.Identity;
using Resourcia.Data.Interfaces;
using System.Security.Claims;
using System.Security.Cryptography;
using System.Text.Json;

namespace Resourcia.Api.Services;

public sealed class ExternalAuthService
{
    private static readonly IReadOnlyDictionary<string, string> SupportedProviders =
        new Dictionary<string, string>(StringComparer.OrdinalIgnoreCase)
        {
            ["Google"] = "Google",
            ["Facebook"] = "Facebook"
        };

    private readonly AppDbContext _dbContext;
    private readonly UserManager<AppUser> _userManager;
    private readonly IClock _clock;
    private readonly ITimeLimitedDataProtector _registrationProtector;

    public ExternalAuthService(
        AppDbContext dbContext,
        UserManager<AppUser> userManager,
        IClock clock,
        IDataProtectionProvider dataProtectionProvider)
    {
        _dbContext = dbContext;
        _userManager = userManager;
        _clock = clock;
        _registrationProtector = dataProtectionProvider
            .CreateProtector("Resourcia.Api.ExternalLogin")
            .ToTimeLimitedDataProtector();
    }

    public string? NormalizeProvider(string provider)
    {
        return SupportedProviders.TryGetValue(provider, out var normalizedProvider)
            ? normalizedProvider
            : null;
    }

    public async Task<ExternalLoginCallbackResult> HandleCallbackAsync(ExternalLoginInfo info)
    {
        var existingProviderUser = await _userManager.FindByLoginAsync(info.LoginProvider, info.ProviderKey);
        if (existingProviderUser != null)
        {
            return ExternalLoginCallbackResult.SignedIn(existingProviderUser);
        }

        var email = info.Principal.FindFirstValue(ClaimTypes.Email);
        if (string.IsNullOrWhiteSpace(info.LoginProvider)
            || string.IsNullOrWhiteSpace(info.ProviderKey)
            || string.IsNullOrWhiteSpace(email))
        {
            return ExternalLoginCallbackResult.Failed("external_email_missing");
        }

        var existingEmailUser = await _userManager.FindByEmailAsync(email);
        if (existingEmailUser != null)
        {
            var linkResult = await _userManager.AddLoginAsync(existingEmailUser, info);
            if (!linkResult.Succeeded)
            {
                return ExternalLoginCallbackResult.Failed("external_login_link_failed");
            }

            return ExternalLoginCallbackResult.SignedIn(existingEmailUser);
        }

        var payload = new ExternalLoginRegistrationPayload(
            info.LoginProvider,
            info.ProviderKey,
            email,
            info.Principal.FindFirstValue(ClaimTypes.Name));

        return ExternalLoginCallbackResult.NeedsProfile(CreateRegistrationToken(payload));
    }

    public async Task<CompleteExternalLoginResult> CompleteExternalLoginAsync(CompleteExternalLoginModel model)
    {
        if (!TryReadRegistrationPayload(model.RegistrationToken, out var payload))
        {
            return CompleteExternalLoginResult.ValidationFailed(
                nameof(CompleteExternalLoginModel.RegistrationToken),
                "INVALID_OR_EXPIRED_REGISTRATION_TOKEN");
        }

        var validationErrors = await ValidateProfileInputAsync(model.DisplayName);
        if (validationErrors.Count > 0)
        {
            return CompleteExternalLoginResult.ValidationFailed(validationErrors);
        }

        var displayName = model.DisplayName.Trim();
        var requestedHandle = ProfileHandleUtility.BuildHandle(displayName);
        var existingEmailUser = await _userManager.FindByEmailAsync(payload.Email);

        if (existingEmailUser != null)
        {
            var linkResult = await _userManager.AddLoginAsync(
                existingEmailUser,
                new UserLoginInfo(payload.Provider, payload.ProviderKey, payload.Provider));

            return linkResult.Succeeded
                ? CompleteExternalLoginResult.Completed(existingEmailUser)
                : CompleteExternalLoginResult.ValidationFailed(ToValidationErrors(linkResult));
        }

        await using var transaction = await _dbContext.Database.BeginTransactionAsync();

        var now = _clock.GetCurrentInstant();
        var newUser = new AppUser
        {
            Id = Guid.NewGuid(),
            DisplayName = displayName,
            Handle = requestedHandle,
            Email = payload.Email,
            EmailConfirmed = true,
            UserName = payload.Email,
        }.SetCreateBySystem(now);

        var createResult = await _userManager.CreateAsync(newUser);
        if (!createResult.Succeeded)
        {
            return CompleteExternalLoginResult.ValidationFailed(ToValidationErrors(createResult));
        }

        var addLoginResult = await _userManager.AddLoginAsync(
            newUser,
            new UserLoginInfo(payload.Provider, payload.ProviderKey, payload.Provider));

        if (!addLoginResult.Succeeded)
        {
            return CompleteExternalLoginResult.ValidationFailed(ToValidationErrors(addLoginResult));
        }

        await transaction.CommitAsync();
        return CompleteExternalLoginResult.Completed(newUser);
    }

    private string CreateRegistrationToken(ExternalLoginRegistrationPayload payload)
    {
        return _registrationProtector.Protect(
            JsonSerializer.Serialize(payload),
            TimeSpan.FromMinutes(15));
    }

    private bool TryReadRegistrationPayload(
        string registrationToken,
        out ExternalLoginRegistrationPayload payload)
    {
        payload = ExternalLoginRegistrationPayload.Empty;

        try
        {
            var serializedPayload = _registrationProtector.Unprotect(registrationToken);
            var parsedPayload = JsonSerializer.Deserialize<ExternalLoginRegistrationPayload>(serializedPayload);

            if (parsedPayload == null
                || string.IsNullOrWhiteSpace(parsedPayload.Provider)
                || string.IsNullOrWhiteSpace(parsedPayload.ProviderKey)
                || string.IsNullOrWhiteSpace(parsedPayload.Email))
            {
                return false;
            }

            payload = parsedPayload;
            return true;
        }
        catch (CryptographicException)
        {
            return false;
        }
        catch (JsonException)
        {
            return false;
        }
    }

    private async Task<Dictionary<string, string[]>> ValidateProfileInputAsync(string displayName)
    {
        var errors = new Dictionary<string, string[]>();
        var trimmedDisplayName = displayName.Trim();

        if (string.IsNullOrWhiteSpace(trimmedDisplayName))
        {
            errors["displayName"] = ["USERNAME_INVALID"];
            return errors;
        }

        var existingUsernameUser = await _userManager.Users
            .FirstOrDefaultAsync(x => x.DisplayName == trimmedDisplayName);

        if (existingUsernameUser != null)
        {
            errors["displayName"] = ["USERNAME_ALREADY_IN_USE"];
        }

        var requestedHandle = ProfileHandleUtility.BuildHandle(trimmedDisplayName);
        if (string.IsNullOrWhiteSpace(requestedHandle))
        {
            errors["displayName"] = ["USERNAME_INVALID"];
            return errors;
        }

        var existingHandleUser = await _userManager.Users
            .FirstOrDefaultAsync(x => x.Handle == requestedHandle);

        if (existingHandleUser != null)
        {
            errors["displayName"] = ["USERNAME_ALREADY_IN_USE"];
        }

        return errors;
    }

    private static Dictionary<string, string[]> ToValidationErrors(IdentityResult result)
    {
        return new Dictionary<string, string[]>
        {
            [string.Empty] = result.Errors.Select(error => error.Description).ToArray()
        };
    }
}

public enum ExternalLoginCallbackStatus
{
    SignedIn,
    NeedsProfile,
    Failed
}

public sealed record ExternalLoginCallbackResult(
    ExternalLoginCallbackStatus Status,
    AppUser? User = null,
    string? RegistrationToken = null,
    string? ErrorCode = null)
{
    public static ExternalLoginCallbackResult SignedIn(AppUser user)
        => new(ExternalLoginCallbackStatus.SignedIn, User: user);

    public static ExternalLoginCallbackResult NeedsProfile(string registrationToken)
        => new(ExternalLoginCallbackStatus.NeedsProfile, RegistrationToken: registrationToken);

    public static ExternalLoginCallbackResult Failed(string errorCode)
        => new(ExternalLoginCallbackStatus.Failed, ErrorCode: errorCode);
}

public enum CompleteExternalLoginStatus
{
    Completed,
    ValidationFailed
}

public sealed record CompleteExternalLoginResult(
    CompleteExternalLoginStatus Status,
    AppUser? User = null,
    IReadOnlyDictionary<string, string[]>? Errors = null)
{
    public static CompleteExternalLoginResult Completed(AppUser user)
        => new(CompleteExternalLoginStatus.Completed, User: user);

    public static CompleteExternalLoginResult ValidationFailed(string field, string error)
        => ValidationFailed(new Dictionary<string, string[]> { [field] = [error] });

    public static CompleteExternalLoginResult ValidationFailed(IReadOnlyDictionary<string, string[]> errors)
        => new(CompleteExternalLoginStatus.ValidationFailed, Errors: errors);
}

public sealed record ExternalLoginRegistrationPayload(
    string Provider,
    string ProviderKey,
    string Email,
    string? Name)
{
    public static ExternalLoginRegistrationPayload Empty { get; } = new(string.Empty, string.Empty, string.Empty, null);
}
