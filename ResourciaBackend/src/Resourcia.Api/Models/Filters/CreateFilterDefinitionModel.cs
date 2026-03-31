using Resourcia.Data.Entities;
using System.ComponentModel.DataAnnotations;

namespace Resourcia.Api.Models.Filters;

public class CreateFilterDefinitionModel
{
    [Required]
    [MaxLength(64)]
    public string Key { get; set; } = null!;

    [Required]
    [MaxLength(128)]
    public string Label { get; set; } = null!;

    [MaxLength(512)]
    public string? Description { get; set; }

    public FilterKind Kind { get; set; }
    public bool IsMulti { get; set; }
    public bool IsActive { get; set; }

    [MaxLength(64)]
    public string? ResourceField { get; set; }

    public List<CreateFacetValueModel> FacetValues { get; set; } = new();
}

public class CreateFacetValueModel
{
    [Required]
    [MaxLength(256)]
    public string Label { get; set; } = null!;
}
