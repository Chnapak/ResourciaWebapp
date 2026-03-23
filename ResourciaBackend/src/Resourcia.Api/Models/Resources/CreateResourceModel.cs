namespace Resourcia.Api.Models.Resources;

public class CreateResourceModel
{
    public required string Title { get; init; }
    public string? Description { get; init; }
    public required string Url { get; init; }

    // Facets by filter key -> list of facet "Value" slugs (FacetValues.Value)
    // Example: { "topic": ["csharp","efcore"], "level": ["beginner"] }
    public Dictionary<string, List<string>> Facets { get; init; } = new();

    // Optional direct fields on Resource (if you want to allow setting them at create time)
    public bool? IsFree { get; init; }
    public int? Year { get; init; }
    public string? Author { get; init; }
    public string? LearningStyle { get; init; }
    public List<string>? Tags { get; init; }
    public double? Rating { get; init; }

}
