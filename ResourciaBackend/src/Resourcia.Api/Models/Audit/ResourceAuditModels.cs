namespace Resourcia.Api.Models.Audit;

public sealed class ResourceAuditSnapshot
{
    public Guid Id { get; set; }
    public string Title { get; set; } = string.Empty;
    public string? Description { get; set; }
    public string Url { get; set; } = string.Empty;
    public bool IsFree { get; set; }
    public int? Year { get; set; }
    public string? Author { get; set; }
    public string LearningStyle { get; set; } = string.Empty;
    public List<string> Tags { get; set; } = new();
    public string? CreatedBy { get; set; }
    public DateTime? DeletedAtUtc { get; set; }
    public string? DeletedBy { get; set; }
    public List<ResourceAuditFilterValue> FilterValues { get; set; } = new();
    public List<ResourceAuditImage> Images { get; set; } = new();
}

public sealed class ResourceAuditFilterValue
{
    public Guid FilterDefinitionsId { get; init; }
    public string Key { get; init; } = string.Empty;
    public Guid? FacetValuesId { get; init; }
    public string? FacetValue { get; init; }
    public string? FacetLabel { get; init; }
    public string? StringValue { get; init; }
    public double? NumberValue { get; init; }
    public bool? BooleanValue { get; init; }
}

public sealed class ResourceAuditImage
{
    public Guid Id { get; init; }
    public string FileName { get; init; } = string.Empty;
    public string OriginalFileName { get; init; } = string.Empty;
    public string ContentType { get; init; } = string.Empty;
    public DateTime UploadedAtUtc { get; init; }
    public Guid UploadedByUserId { get; init; }
    public bool IsDeleted { get; init; }
    public DateTime? DeletedAtUtc { get; init; }
    public Guid? DeletedByUserId { get; init; }
}

public sealed class ResourceAuditDiffItem
{
    public string Field { get; init; } = string.Empty;
    public object? Before { get; init; }
    public object? After { get; init; }
    public List<string>? Added { get; init; }
    public List<string>? Removed { get; init; }
    public List<string>? Warnings { get; init; }
}
