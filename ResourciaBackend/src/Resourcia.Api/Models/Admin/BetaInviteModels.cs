namespace Resourcia.Api.Models.Admin;

public class CreateBetaInviteModel
{
    public required string Email { get; set; }
}

public class BetaInviteListResponseModel
{
    public required string RegistrationMode { get; set; }
    public required List<BetaInviteListItemModel> Items { get; set; }
}

public class BetaInviteListItemModel
{
    public Guid Id { get; set; }
    public required string Email { get; set; }
    public required string Status { get; set; }
    public DateTime CreatedAtUtc { get; set; }
    public string? CreatedBy { get; set; }
    public DateTime? UsedAtUtc { get; set; }
    public Guid? UsedByUserId { get; set; }
    public DateTime? RevokedAtUtc { get; set; }
    public string? RevokedBy { get; set; }
}
