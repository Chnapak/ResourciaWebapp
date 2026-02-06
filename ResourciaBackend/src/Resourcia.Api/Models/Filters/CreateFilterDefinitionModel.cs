using Resourcia.Data.Entities;

namespace Resourcia.Api.Models.Filters;

public class CreateFilterDefinitionModel
{
    public string Key { get; set; } = null!;
    public string Label { get; set; } = null!;
    public string? Description { get; set; }
    public FilterKind Kind { get; set; }
    public bool IsMulti { get; set; }
}
