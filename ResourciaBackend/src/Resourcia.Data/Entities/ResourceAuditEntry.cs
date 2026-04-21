using System;
using System.ComponentModel.DataAnnotations;

namespace Resourcia.Data.Entities;

public enum ResourceAuditActionType
{
    Create = 0,
    Update = 1,
    SoftDelete = 2,
    Restore = 3,
    Revert = 4,
    ImageAdd = 5,
    ImageDelete = 6,
    FiltersUpdate = 7
}

public class ResourceAuditEntry
{
    public Guid Id { get; set; } = Guid.NewGuid();

    public Guid ResourceId { get; set; }
    public Resource Resource { get; set; } = null!;

    public Guid? ActorUserId { get; set; }

    [MaxLength(DatabaseConstants.TrackableByLength)]
    public string? ActorDisplayName { get; set; }

    [MaxLength(64)]
    public string? ActorRole { get; set; }

    public ResourceAuditActionType ActionType { get; set; }

    public DateTime CreatedAtUtc { get; set; } = DateTime.UtcNow;

    [MaxLength(32)]
    public string Source { get; set; } = string.Empty;

    [MaxLength(DatabaseConstants.TrackableByLength)]
    public string? CorrelationId { get; set; }

    [MaxLength(64)]
    public string? IpAddress { get; set; }

    [MaxLength(512)]
    public string? UserAgent { get; set; }

    [MaxLength(500)]
    public string? Reason { get; set; }

    public string? BeforeJson { get; set; }
    public string? AfterJson { get; set; }
    public string? DiffJson { get; set; }

    public Guid? RevertedAuditId { get; set; }
}
