using Microsoft.AspNetCore.Identity;
using NodaTime;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using ResourciaApi.Data.Interfaces;

namespace ResourciaApi.Data.Entities.Identity;

public class AppUser : IdentityUser<Guid>, ITrackable
{
    public string DisplayName { get; set; } = null!;
    public Instant CreatedAt { get; set; }
    public string CreatedBy { get; set; } = null!;
    public Instant ModifiedAt { get; set; }
    public string ModifiedBy { get; set; } = null!;
    public Instant? DeletedAt { get; set; }
    public string? DeletedBy { get; set; }
}
