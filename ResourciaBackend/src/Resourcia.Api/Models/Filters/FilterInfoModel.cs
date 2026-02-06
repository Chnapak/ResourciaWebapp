using Resourcia.Data.Entities;
using System.ComponentModel.DataAnnotations;

namespace Resourcia.Api.Models.Filters;

public class FilterInfoModel
{
    public string Key { get; set; } = null!;
    public string Label { get; set; } = null!;
    public string? Description { get; set; }
    public FilterKind Kind { get; set; }
    public bool IsMulti { get; set; }
    public bool IsActive { get; set; }
    public int SortOrder { get; set; }
    public ICollection<FacetValues> FacetValues { get; set; } = new List<FacetValues>();
}
