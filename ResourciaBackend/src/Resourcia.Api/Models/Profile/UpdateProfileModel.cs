using System.ComponentModel.DataAnnotations;

namespace Resourcia.Api.Models.Profile;

public class UpdateProfileModel
{
    [Required]
    [MinLength(2)]
    [MaxLength(100)]
    public string DisplayName { get; set; } = string.Empty;

    [Required]
    [MinLength(3)]
    [MaxLength(64)]
    [RegularExpression("^[a-zA-Z0-9._-]+$")]
    public string Handle { get; set; } = string.Empty;

    [MaxLength(500)]
    public string? Bio { get; set; }

    [MaxLength(120)]
    public string? Location { get; set; }

    [MaxLength(255)]
    public string? Website { get; set; }

    [MaxLength(10)]
    public List<string> Interests { get; set; } = [];
}
