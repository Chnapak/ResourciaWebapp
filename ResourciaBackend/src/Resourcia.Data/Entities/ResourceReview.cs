using NodaTime;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Resourcia.Data.Entities;

public class ResourceReview
{
    public Guid Id { get; set; }
    public Guid ResourceId { get; set; }
    public Resource Resource { get; set; }
    public Guid UserId { get; set; }
    public int Rating { get; set; }
    public string Content { get; set; }
    public Instant? CreatedAt { get; set; }
    public Instant? UpdatedAt { get; set; }
    public List<ReviewVotes> Votes { get; set; } = new(); 
}
