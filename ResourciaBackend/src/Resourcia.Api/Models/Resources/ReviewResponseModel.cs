using NodaTime;

namespace Resourcia.Api.Models.Resources;

public class ReviewResponseModel
{
    public Guid Id { get; set; }
    public Guid ResourceId { get; set; }
    public Guid UserId { get; set; }
    public string Username { get; set; } = null!;
    public string? AvatarUrl { get; set; }
    public int Rating { get; set; }
    public string? Content { get; set; }
    public Instant? CreatedAt { get; set; }
    public Instant? UpdatedAt { get; set; }
    public int Downvotes { get; set; }
    public int Upvotes { get; set; }
    public bool? UserVote { get; set; } // true = upvoted, false = downvoted, null = no vote
}
