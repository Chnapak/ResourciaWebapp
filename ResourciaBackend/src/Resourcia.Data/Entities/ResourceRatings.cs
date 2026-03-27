using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Resourcia.Data.Entities;

public class ResourceRatings
{
    [Key]
    public Guid Id { get; set; } = Guid.NewGuid();
    public Guid ResourceId { get; set; }
    public float AverageRating { get; set; }
    public int TotalCount { get; set; }
    public int Count1 { get; set; }
    public int Count2 { get; set; }
    public int Count3 { get; set; }
    public int Count4 { get; set; }
    public int Count5 { get; set; }

    public Resource Resource { get; set; }
}
