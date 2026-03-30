namespace Resourcia.Api.Models.Profile;

public class ProfileResourceModel
{
    public string Id { get; set; } = string.Empty;

    public string Title { get; set; } = string.Empty;

    public string Domain { get; set; } = string.Empty;

    public string Type { get; set; } = string.Empty;

    public double Rating { get; set; }

    public int RatingCount { get; set; }

    public int Saves { get; set; }

    public DateTime AddedAt { get; set; }
}
