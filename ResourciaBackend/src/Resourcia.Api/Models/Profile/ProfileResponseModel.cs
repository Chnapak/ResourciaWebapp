namespace Resourcia.Api.Models.Profile;

public class ProfileResponseModel
{
    public string Id { get; set; } = string.Empty;

    public string Name { get; set; } = string.Empty;

    public string Handle { get; set; } = string.Empty;

    public string Bio { get; set; } = string.Empty;

    public string AvatarInitials { get; set; } = string.Empty;

    public string? AvatarUrl { get; set; }

    public string Role { get; set; } = "contributor";

    public bool IsVerified { get; set; }

    public DateTime JoinedAt { get; set; }

    public DateTime LastActive { get; set; }

    public string? Location { get; set; }

    public string? Website { get; set; }

    public List<string> Interests { get; set; } = [];

    public ProfileStatsModel Stats { get; set; } = new();

    public List<ProfileResourceModel> SharedResources { get; set; } = [];

    public List<ProfileResourceModel> SavedResources { get; set; } = [];

    public List<ProfileReviewModel> RecentReviews { get; set; } = [];

    public List<ProfileActivityModel> RecentActivity { get; set; } = [];
}
