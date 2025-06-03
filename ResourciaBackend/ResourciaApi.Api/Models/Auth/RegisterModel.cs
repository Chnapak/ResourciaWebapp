using System.ComponentModel.DataAnnotations;

namespace Resourcia.Api.Models.Auth;

public class RegisterModel
{
    [Required]
    public string DisplayName { get; set; } = null!;

    [Required]
    [EmailAddress]
    public string Email { get; set; } = null!;

    [Required]
    public string Password { get; set; } = null!;

    [Required]
    [Compare("Password")]
    public string ConfirmPassword { get; set; } = null!;
}
