using Microsoft.EntityFrameworkCore;
using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Resourcia.Data.Entities;

[Table(nameof(FacetValues))]
[Index(nameof(FilterDefinitionsId), nameof(Value), IsUnique = true)]
public class FacetValues
{
    [Key]
    public Guid Id { get; set; } = Guid.NewGuid();

    // Which filter these values belong to (subject/author/format/...)
    public Guid FilterDefinitionsId { get; set; }
    public FilterDefinitions FilterDefinitions { get; set; } = null!;

    // Stable value sent in requests (slug). Don’t use Label as the id.
    [Required, MaxLength(128)]
    public required string Value { get; set; }

    // Display text
    [Required, MaxLength(256)]
    public required string Label { get; set; }

    public bool IsActive { get; set; } = true;
    public int SortOrder { get; set; } = 0;

    public ICollection<ResourceFacetValues> ResourceFacetValues { get; set; } = new List<ResourceFacetValues>();
}
