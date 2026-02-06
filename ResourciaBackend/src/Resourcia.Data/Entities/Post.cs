using NodaTime;
using Resourcia.Data;
using Resourcia.Data.Entities.Identity;
using Resourcia.Data.Interfaces;
using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Resourcia.Data.Entities;
[Table(nameof(Post))]
public class Post : ITrackable
{
    public Guid Id { get; set; }
    [MaxLength(Metadata.ContentLength)]
    public string Content { get; set; } = null!;

    public AppUser Author { get; set; } = null!;
    public Guid AuthorId { get; set; }

    #region Trackable
    public Instant CreatedAt { get; set; }
    [MaxLength(Metadata.TrackableByLength)]
    public string CreatedBy { get; set; } = null!;
    [MaxLength(Metadata.TrackableByLength)]
    public Instant ModifiedAt { get; set; }
    [MaxLength(Metadata.TrackableByLength)]
    public string ModifiedBy { get; set; } = null!;
    public Instant? DeletedAt { get; set; }
    [MaxLength(Metadata.TrackableByLength)]
    public string? DeletedBy { get; set; }
    #endregion

    public static class Metadata
    {
        public const int ContentLength = DatabaseConstants.ContentLength;
        public const int TrackableByLength = DatabaseConstants.TrackableByLength;
    }
}
