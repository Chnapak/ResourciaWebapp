using Microsoft.AspNetCore.Mvc;
using NodaTime;
using Resourcia.Data.Entities.Identity;
using System;
using System.Collections.Generic;
using System.ComponentModel;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Resourcia.Data.Entities;

public class DiscussionReplies
{
    public Guid Id { get; set; }
    public Guid DiscussionId { get; set; }
    public Discussions Discussions { get; set; } = null!;
    public Guid UserId { get; set; }
    public AppUser User { get; set; } = null!;
    public string Content { get; set; } = null!;
    public Instant CreatedAt { get; set; }
}
