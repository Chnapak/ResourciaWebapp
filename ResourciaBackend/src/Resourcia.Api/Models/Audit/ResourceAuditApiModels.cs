using Resourcia.Data.Entities;

namespace Resourcia.Api.Models.Audit;

public sealed class ResourceAuditEntryListItem
{
    public Guid Id { get; init; }
    public ResourceAuditActionType ActionType { get; init; }
    public DateTime CreatedAtUtc { get; init; }
    public string? ActorDisplayName { get; init; }
    public string? ActorRole { get; init; }
    public string Source { get; init; } = string.Empty;
    public string? Reason { get; init; }
    public Guid? RevertedAuditId { get; init; }
}

public sealed class ResourceAuditEntryListResponse
{
    public Guid ResourceId { get; init; }
    public string? ResourceTitle { get; init; }
    public bool IsDeleted { get; init; }
    public List<ResourceAuditEntryListItem> Items { get; init; } = new();
    public int TotalCount { get; init; }
    public int Page { get; init; }
    public int PageSize { get; init; }
}

public sealed class ResourceAuditEntryDetail
{
    public Guid Id { get; init; }
    public ResourceAuditActionType ActionType { get; init; }
    public DateTime CreatedAtUtc { get; init; }
    public string? ActorDisplayName { get; init; }
    public string? ActorRole { get; init; }
    public string Source { get; init; } = string.Empty;
    public string? Reason { get; init; }
    public Guid? RevertedAuditId { get; init; }
    public ResourceAuditSnapshot? Before { get; init; }
    public ResourceAuditSnapshot? After { get; init; }
    public List<ResourceAuditDiffItem> Diff { get; init; } = new();
}

public sealed class ResourceRevertRequest
{
    public Guid AuditId { get; init; }
    public string? Reason { get; init; }
}
