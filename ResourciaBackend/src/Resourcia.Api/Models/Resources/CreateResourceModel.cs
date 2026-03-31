namespace Resourcia.Api.Models.Resources;

public class CreateResourceModel
{
    public required string Title { get; init; }
    public string? Description { get; init; }
    public required string Url { get; init; }

    // Legacy alias for selectable filter values.
    public Dictionary<string, List<string>> Facets { get; init; } = new();

    // Generic filter values keyed by filter key. This supports selectable values,
    // raw text values, booleans, and numeric values for filters without a direct resource field.
    public Dictionary<string, List<string>> FilterValues { get; init; } = new();

    // Optional direct fields on Resource (if you want to allow setting them at create time)
    public bool? IsFree { get; init; }
    public int? Year { get; init; }
    public string? Author { get; init; }
    public string? LearningStyle { get; init; }
    public List<string>? Tags { get; init; }
    public double? Rating { get; init; }

}
