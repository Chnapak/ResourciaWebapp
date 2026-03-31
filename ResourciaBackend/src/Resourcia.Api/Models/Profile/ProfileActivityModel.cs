namespace Resourcia.Api.Models.Profile;

public class ProfileActivityModel
{
    public string Id { get; set; } = string.Empty;

    public string Type { get; set; } = string.Empty;

    public string Description { get; set; } = string.Empty;

    public string? Target { get; set; }

    public string? TargetId { get; set; }

    public DateTime Timestamp { get; set; }
}
