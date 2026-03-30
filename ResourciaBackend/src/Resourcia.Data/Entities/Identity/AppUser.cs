using Microsoft.AspNetCore.Identity;
using NodaTime;
using Resourcia.Data.Entities;
using Resourcia.Data.Interfaces;
using System.ComponentModel.DataAnnotations;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Text.Json.Serialization;
using System.Threading.Tasks;

namespace Resourcia.Data.Entities.Identity;

public enum UserStatus
{
    Active = 0,
    Suspended = 1,
    Banned = 2
}
public class AppUser : IdentityUser<Guid>, ITrackable
{
    [MaxLength(100)]
    public string DisplayName { get; set; } = null!;

    [MaxLength(64)]
    public string Handle { get; set; } = null!;

    [MaxLength(500)]
    public string? Bio { get; set; }

    [MaxLength(120)]
    public string? Location { get; set; }

    [MaxLength(255)]
    public string? Website { get; set; }

    public string? InterestsJson { get; set; }

    public ICollection<Post> Posts { get; set; } = [];
    public Instant CreatedAt { get; set; }
    public string CreatedBy { get; set; } = null!;
    public Instant ModifiedAt { get; set; }
    public string ModifiedBy { get; set; } = null!;
    public Instant? DeletedAt { get; set; }
    public string? DeletedBy { get; set; }
    public UserStatus Status { get; set; } = UserStatus.Active;
    public string? ModerationReason { get; set; }
    public Guid? ModeratedBy { get; set; }
}
