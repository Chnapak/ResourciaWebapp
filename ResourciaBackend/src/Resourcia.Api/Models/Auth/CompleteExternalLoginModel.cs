using System.ComponentModel.DataAnnotations;

namespace Resourcia.Api.Models.Auth;

public class CompleteExternalLoginModel
{
    [Required]
    public string RegistrationToken { get; set; } = string.Empty;

    [Required]
    [StringLength(50, MinimumLength = 3)]
    public string DisplayName { get; set; } = string.Empty;
}
