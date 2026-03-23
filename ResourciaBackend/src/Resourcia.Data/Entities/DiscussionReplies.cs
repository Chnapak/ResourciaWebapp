using Microsoft.AspNetCore.Mvc;
using NodaTime;
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
    public Discussions Discussions { get; set; }
    public Guid UserId { get; set; }
    public string Content { get; set; }
    public Instant CreatedAt { get; set; }
}
