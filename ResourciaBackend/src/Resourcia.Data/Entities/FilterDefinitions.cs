using Microsoft.EntityFrameworkCore;
using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Resourcia.Data.Entities;
public enum FilterKind
{
    Facet = 0,
    Range = 1,
    Boolean = 2,
    Text = 3
}

[Table(nameof(FilterDefinitions))]
[Index(nameof(Key), IsUnique = true)]
public class FilterDefinitions
{
    [Key]
    public Guid Id { get; set; } = Guid.NewGuid();

    [Required, MaxLength(64)]
    public required string Key { get; set; }

    [Required, MaxLength(128)]
    public required string Label { get; set; }

    [MaxLength(512)]
    public string? Description { get; set; }

    public FilterKind Kind { get; set; } = FilterKind.Facet;

    public bool IsMulti { get; set; } = true;

    public bool IsActive { get; set; } = false;

    public int SortOrder { get; set; } = 0;

    [MaxLength(64)]
    public string? ResourceField { get; set; }

    public ICollection<FacetValues> FacetValues { get; set; } = new List<FacetValues>();
}
