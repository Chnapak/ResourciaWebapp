using System;
using System.ComponentModel.DataAnnotations;

namespace Resourcia.Data.Entities;

public class BetaInvite
{
    public Guid Id { get; set; } = Guid.NewGuid();

    [MaxLength(256)]
    public required string Email { get; set; }

    [MaxLength(256)]
    public required string NormalizedEmail { get; set; }

    public DateTime CreatedAtUtc { get; set; } = DateTime.UtcNow;

    [MaxLength(DatabaseConstants.TrackableByLength)]
    public string? CreatedBy { get; set; }

    public DateTime? UsedAtUtc { get; set; }

    public Guid? UsedByUserId { get; set; }

    public DateTime? RevokedAtUtc { get; set; }

    [MaxLength(DatabaseConstants.TrackableByLength)]
    public string? RevokedBy { get; set; }
}
