using NodaTime;

namespace Resourcia.Api.Models.Resources;

public class ReviewModel
{
    public Guid Id { get; set; }
    public string Username { get; set; }
    public string? AvatarUrl { get; set; }
    public string Content { get; set; }
    public int Rating { get; set; }
    public int Upvotes { get; set; }
    public int Downvotes { get; set; }
    public Instant? CreatedAt { get; set; }
}
