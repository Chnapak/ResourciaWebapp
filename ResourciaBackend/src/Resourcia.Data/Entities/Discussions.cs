using NodaTime;
using Resourcia.Data.Entities.Identity;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Resourcia.Data.Entities;

public class Discussions
{
    public Guid Id { get; set; }
    public Guid ResourceId { get; set; }
    public Resource Resource { get; set; }
    public Guid UserId { get; set; }
    public AppUser User { get; set; } = null!;
    public string Content { get; set; }
    public Instant CreatedAt { get; set; }
    public List<DiscussionReplies> Replies { get; set; } = new();
}
