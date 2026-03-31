using System.ComponentModel.DataAnnotations;

namespace Resourcia.Api.Models.Filters;

public class UpdateFilterDefinitionModel
{
    [Required]
    [MaxLength(128)]
    public string Label { get; set; } = null!;

    [MaxLength(512)]
    public string? Description { get; set; }

    public List<UpdateFacetValueModel> FacetValues { get; set; } = new();
}

public class UpdateFacetValueModel
{
    public Guid? Id { get; set; }

    [Required]
    [MaxLength(256)]
    public string Label { get; set; } = null!;
}
