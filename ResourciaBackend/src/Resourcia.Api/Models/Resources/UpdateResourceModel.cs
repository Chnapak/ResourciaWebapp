namespace Resourcia.Api.Models.Resources;

public class UpdateResourceModel
{
    public string? Title { get; init; }
    public string? Description { get; init; }
    public string? Url { get; init; }

    public Dictionary<string, List<string>>? Facets { get; init; }
    public Dictionary<string, List<string>>? FilterValues { get; init; }

    public bool? IsFree { get; init; }
    public int? Year { get; init; }
    public string? Author { get; init; }
    public string? LearningStyle { get; init; }
    public List<string>? Tags { get; init; }
}
