namespace Resourcia.Api.Models.Profile;

public class ProfileReviewModel
{
    public string Id { get; set; } = string.Empty;

    public string ResourceTitle { get; set; } = string.Empty;

    public string ResourceId { get; set; } = string.Empty;

    public int Rating { get; set; }

    public string Body { get; set; } = string.Empty;

    public int Helpful { get; set; }

    public int NotHelpful { get; set; }

    public DateTime PostedAt { get; set; }
}
