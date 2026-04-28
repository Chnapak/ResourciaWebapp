using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Options;
using NodaTime;
using Resourcia.Api.Options;
using Resourcia.Data;
using Resourcia.Data.Entities;

namespace Resourcia.Api.Services;

public sealed class RegistrationInviteService
{
    private readonly AppDbContext _dbContext;
    private readonly IClock _clock;
    private readonly RegistrationOptions _options;

    public RegistrationInviteService(
        AppDbContext dbContext,
        IClock clock,
        IOptions<RegistrationOptions> options)
    {
        _dbContext = dbContext;
        _clock = clock;
        _options = options.Value;
    }

    public RegistrationMode Mode => _options.Mode;

    public bool RequiresInvite => _options.RequiresInvite;

    public async Task<bool> CanRegisterAsync(string email, CancellationToken ct = default)
    {
        return !RequiresInvite || await HasPendingInviteAsync(email, ct);
    }

    public async Task<IReadOnlyList<BetaInvite>> ListInvitesAsync(CancellationToken ct = default)
    {
        return await _dbContext.BetaInvites
            .AsNoTracking()
            .OrderByDescending(invite => invite.CreatedAtUtc)
            .ToListAsync(ct);
    }

    public async Task<CreateBetaInviteResult> CreateInviteAsync(
        string email,
        string? createdBy,
        CancellationToken ct = default)
    {
        var normalizedEmail = NormalizeEmail(email);
        if (string.IsNullOrWhiteSpace(normalizedEmail))
        {
            return CreateBetaInviteResult.InvalidEmail();
        }

        var emailInUse = await _dbContext.Users
            .IgnoreQueryFilters()
            .AnyAsync(user => user.NormalizedEmail == normalizedEmail && user.DeletedAt == null, ct);

        if (emailInUse)
        {
            return CreateBetaInviteResult.EmailAlreadyRegistered();
        }

        var existingPendingInvite = await GetPendingInviteAsync(normalizedEmail, ct);
        if (existingPendingInvite != null)
        {
            return CreateBetaInviteResult.AlreadyExists(existingPendingInvite);
        }

        var invite = new BetaInvite
        {
            Id = Guid.NewGuid(),
            Email = email.Trim(),
            NormalizedEmail = normalizedEmail,
            CreatedAtUtc = NowUtc(),
            CreatedBy = createdBy,
        };

        _dbContext.BetaInvites.Add(invite);
        await _dbContext.SaveChangesAsync(ct);

        return CreateBetaInviteResult.Created(invite);
    }

    public async Task<bool> RevokeInviteAsync(Guid inviteId, string? revokedBy, CancellationToken ct = default)
    {
        var invite = await _dbContext.BetaInvites.SingleOrDefaultAsync(current => current.Id == inviteId, ct);
        if (invite == null)
        {
            return false;
        }

        if (invite.UsedAtUtc != null || invite.RevokedAtUtc != null)
        {
            return true;
        }

        invite.RevokedAtUtc = NowUtc();
        invite.RevokedBy = revokedBy;
        await _dbContext.SaveChangesAsync(ct);

        return true;
    }

    public async Task MarkInviteUsedAsync(string email, Guid userId, CancellationToken ct = default)
    {
        if (!RequiresInvite)
        {
            return;
        }

        var invite = await GetPendingInviteAsync(email, ct);
        if (invite == null)
        {
            throw new InvalidOperationException("Registration invite is required.");
        }

        invite.UsedAtUtc = NowUtc();
        invite.UsedByUserId = userId;
        await _dbContext.SaveChangesAsync(ct);
    }

    private async Task<bool> HasPendingInviteAsync(string email, CancellationToken ct)
        => await GetPendingInviteAsync(email, ct) != null;

    private async Task<BetaInvite?> GetPendingInviteAsync(string email, CancellationToken ct)
    {
        var normalizedEmail = NormalizeEmail(email);
        if (string.IsNullOrWhiteSpace(normalizedEmail))
        {
            return null;
        }

        return await _dbContext.BetaInvites
            .SingleOrDefaultAsync(invite =>
                invite.NormalizedEmail == normalizedEmail
                && invite.UsedAtUtc == null
                && invite.RevokedAtUtc == null,
                ct);
    }

    private DateTime NowUtc() => _clock.GetCurrentInstant().ToDateTimeUtc();

    public static string NormalizeEmail(string email) => email.Trim().ToUpperInvariant();
}

public enum CreateBetaInviteStatus
{
    Created,
    AlreadyExists,
    InvalidEmail,
    EmailAlreadyRegistered
}

public sealed record CreateBetaInviteResult(CreateBetaInviteStatus Status, BetaInvite? Invite)
{
    public static CreateBetaInviteResult Created(BetaInvite invite)
        => new(CreateBetaInviteStatus.Created, invite);

    public static CreateBetaInviteResult AlreadyExists(BetaInvite invite)
        => new(CreateBetaInviteStatus.AlreadyExists, invite);

    public static CreateBetaInviteResult InvalidEmail()
        => new(CreateBetaInviteStatus.InvalidEmail, null);

    public static CreateBetaInviteResult EmailAlreadyRegistered()
        => new(CreateBetaInviteStatus.EmailAlreadyRegistered, null);
}
