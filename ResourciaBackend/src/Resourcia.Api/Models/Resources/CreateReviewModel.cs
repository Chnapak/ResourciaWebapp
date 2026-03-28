using System.ComponentModel.DataAnnotations;

namespace Resourcia.Api.Models.Resources;

public class CreateReviewModel
{
    [Required]
    [MaxLength(4000, ErrorMessage = "Review content cannot exceed 4000 characters.")]
    public string Content { get; set; } = null!;

    [Required]
    [Range(1, 5, ErrorMessage = "Rating must be between 1 and 5.")]
    public int Rating { get; set; }
}
