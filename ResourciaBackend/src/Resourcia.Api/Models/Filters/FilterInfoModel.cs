using NodaTime;
using Resourcia.Data.Entities;
using System.ComponentModel.DataAnnotations;

namespace Resourcia.Api.Models.Filters;

public class FilterInfoModel
{
    public Guid Id { get; set; }
    public string Key { get; set; } = null!;
    public string Label { get; set; } = null!;
    public string? Description { get; set; }
    public FilterKind Kind { get; set; }
    public bool IsMulti { get; set; }
    public bool IsActive { get; set; }
    public decimal SortOrder { get; set; }
    public ICollection<FacetValues> FacetValues { get; set; } = new List<FacetValues>();
    public int ResourceCount { get; set; }
    public Instant CreatedAt { get; set; }
    public string CreatedBy { get; set; } = null!;
    public Instant LastChangeAt { get; set; }
    public string? ModifiedBy { get; set; }
}
