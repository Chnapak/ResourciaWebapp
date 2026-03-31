using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using System.ComponentModel.DataAnnotations;

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

    public int SavesCount { get; set; }

    public DateTime CreatedAtUtc { get; set; } = DateTime.UtcNow;

    public DateTime UpdatedAtUtc { get; set; } = DateTime.UtcNow;

    public DateTime? DeletedAtUtc { get; set; }

    [MaxLength(DatabaseConstants.TrackableByLength)]
    public string? CreatedBy { get; set; }

    [MaxLength(DatabaseConstants.TrackableByLength)]
    public string? DeletedBy { get; set; }

    public ICollection<ResourceFilterValues> ResourceFilterValues { get; set; } = new List<ResourceFilterValues>();
    public List<ResourceReview> ResourceReviews { get; set; } = new();

    public List<Discussions> Discussions { get; set;} = new();
    public List<SavedResource> SavedResources { get; set; } = new();
    public ResourceRatings? Ratings { get; set; } = null!;
    public List<ResourceImage> Images { get; set; } = new();

}
