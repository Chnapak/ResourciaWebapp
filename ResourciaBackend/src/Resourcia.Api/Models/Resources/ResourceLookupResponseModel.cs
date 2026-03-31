namespace Resourcia.Api.Models.Resources;

public class ResourceLookupResponseModel
{
    public List<ResourceLookupItemModel> Items { get; set; } = new();
}

public class ResourceLookupItemModel
{
    public string Domain { get; set; } = string.Empty;
    public int ResourceCount { get; set; }
    public Guid Id { get; set; }
    public string Title { get; set; } = string.Empty;
    public string? Description { get; set; }
    public string Url { get; set; } = string.Empty;
    public bool IsFree { get; set; }
    public string? LearningStyle { get; set; }
    public ResourceLookupRatingsModel? Ratings { get; set; }
    public List<ResourceLookupFacetModel> Facets { get; set; } = new();
}

public class ResourceLookupRatingsModel
{
    public float AverageRating { get; set; }
    public int TotalCount { get; set; }
}

public class ResourceLookupFacetModel
{
    public string Key { get; set; } = string.Empty;
    public string Value { get; set; } = string.Empty;
    public string? Label { get; set; }
}
