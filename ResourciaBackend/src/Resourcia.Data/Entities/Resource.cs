using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Resourcia.Data.Entities;

public class Resource
{
    public Guid Id { get; set; } = Guid.NewGuid();

    public string Title { get; set; } = string.Empty;

    public string? Description { get; set; }

    /// <summary>
    /// Target website / resource URL.
    /// </summary>
    public string Url { get; set; } = string.Empty;

    public bool IsFree { get; set; }

    public int? Year { get; set; }

    public string? Author { get; set; }

    /// <summary>
    /// Learning style the resource focuses on (e.g., Interactive, Video, Reading, Practice).
    /// </summary>
    public string LearningStyle { get; set; } = string.Empty;

    public List<string> Tags { get; set; } = new();

    public double? Rating { get; set; }

    public int SavesCount { get; set; }

    public DateTime CreatedAtUtc { get; set; } = DateTime.UtcNow;

    public DateTime UpdatedAtUtc { get; set; } = DateTime.UtcNow;

    public ICollection<ResourceFacetValues> ResourceFacetValues { get; set; } = new List<ResourceFacetValues>();
}
