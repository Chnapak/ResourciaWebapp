using Microsoft.AspNetCore.Identity;
using NodaTime;
using Resourcia.Data.Entities;
using Resourcia.Data.Interfaces;
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
    public string DisplayName { get; set; } = null!;

    public ICollection<Post> Posts { get; set; } = [];
    public Instant CreatedAt { get; set; }
    public string CreatedBy { get; set; } = null!;
    public Instant ModifiedAt { get; set; }
    public string ModifiedBy { get; set; } = null!;
    public Instant? DeletedAt { get; set; }
    public string? DeletedBy { get; set; }
    public UserStatus Status { get; set; } = UserStatus.Active;
    public Instant? SuspensionUntil { get; set; }
}
