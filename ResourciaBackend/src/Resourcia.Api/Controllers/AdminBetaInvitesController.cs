using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Resourcia.Api.Models.Admin;
using Resourcia.Api.Services;
using Resourcia.Data.Entities;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;

namespace Resourcia.Api.Controllers;

[Route("api/admin/beta-invites")]
[ApiController]
[Authorize(Roles = "Admin")]
public class AdminBetaInvitesController : ControllerBase
{
    private readonly RegistrationInviteService _registrationInviteService;

    public AdminBetaInvitesController(RegistrationInviteService registrationInviteService)
    {
        _registrationInviteService = registrationInviteService;
    }

    [HttpGet]
    public async Task<ActionResult<BetaInviteListResponseModel>> GetInvites(CancellationToken ct)
    {
        var invites = await _registrationInviteService.ListInvitesAsync(ct);

        return Ok(new BetaInviteListResponseModel
        {
            RegistrationMode = _registrationInviteService.Mode.ToString(),
            Items = invites.Select(ToModel).ToList()
        });
    }

    [HttpPost]
    public async Task<ActionResult<BetaInviteListItemModel>> CreateInvite(
        [FromBody] CreateBetaInviteModel request,
        CancellationToken ct)
    {
        if (string.IsNullOrWhiteSpace(request.Email))
        {
            ModelState.AddModelError(nameof(request.Email), "EMAIL_REQUIRED");
            return ValidationProblem(ModelState);
        }

        var result = await _registrationInviteService.CreateInviteAsync(
            request.Email,
            GetActorName(),
            ct);

        return result.Status switch
        {
            CreateBetaInviteStatus.Created => CreatedAtAction(
                nameof(GetInvites),
                ToModel(result.Invite!)),
            CreateBetaInviteStatus.AlreadyExists => Conflict(new { error = "INVITE_ALREADY_EXISTS" }),
            CreateBetaInviteStatus.EmailAlreadyRegistered => Conflict(new { error = "EMAIL_ALREADY_REGISTERED" }),
            _ => BadRequest(new { error = "EMAIL_INVALID" })
        };
    }

    [HttpDelete("{id:guid}")]
    public async Task<IActionResult> RevokeInvite(Guid id, CancellationToken ct)
    {
        var revoked = await _registrationInviteService.RevokeInviteAsync(id, GetActorName(), ct);
        return revoked ? NoContent() : NotFound();
    }

    private string? GetActorName()
        => User.FindFirstValue(JwtRegisteredClaimNames.Name)
           ?? User.FindFirstValue(ClaimTypes.Name)
           ?? User.Identity?.Name;

    private static BetaInviteListItemModel ToModel(BetaInvite invite)
    {
        return new BetaInviteListItemModel
        {
            Id = invite.Id,
            Email = invite.Email,
            Status = GetStatus(invite),
            CreatedAtUtc = invite.CreatedAtUtc,
            CreatedBy = invite.CreatedBy,
            UsedAtUtc = invite.UsedAtUtc,
            UsedByUserId = invite.UsedByUserId,
            RevokedAtUtc = invite.RevokedAtUtc,
            RevokedBy = invite.RevokedBy
        };
    }

    private static string GetStatus(BetaInvite invite)
    {
        if (invite.UsedAtUtc != null)
        {
            return "Used";
        }

        if (invite.RevokedAtUtc != null)
        {
            return "Revoked";
        }

        return "Pending";
    }
}
