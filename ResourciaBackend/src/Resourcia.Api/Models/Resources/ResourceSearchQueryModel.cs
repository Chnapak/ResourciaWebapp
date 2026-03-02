namespace Resourcia.Api.Models.Resources;

public class ResourceSearchQueryModel
{
    public string? Q { get; set; }
    public int Page { get; set; } = 1;
    public int PageSize { get; set; } = 20;
    public Dictionary<string, List<string>> Facets { get; set; } = new();
}
