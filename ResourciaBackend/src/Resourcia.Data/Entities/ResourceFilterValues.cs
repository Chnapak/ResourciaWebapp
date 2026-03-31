using Microsoft.EntityFrameworkCore;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace Resourcia.Data.Entities;

[Table(nameof(ResourceFilterValues))]
[Index(nameof(ResourceId), nameof(FilterDefinitionsId))]
[Index(nameof(FilterDefinitionsId))]
[Index(nameof(FacetValuesId))]
public class ResourceFilterValues
{
    [Key]
    public Guid Id { get; set; } = Guid.NewGuid();

    public Guid ResourceId { get; set; }
    public Resource Resource { get; set; } = null!;

    public Guid FilterDefinitionsId { get; set; }
    public FilterDefinitions FilterDefinitions { get; set; } = null!;

    public Guid? FacetValuesId { get; set; }
    public FacetValues? FacetValues { get; set; }

    [MaxLength(512)]
    public string? StringValue { get; set; }

    public double? NumberValue { get; set; }

    public bool? BooleanValue { get; set; }
}
