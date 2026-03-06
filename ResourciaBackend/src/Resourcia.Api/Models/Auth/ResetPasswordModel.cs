using System.ComponentModel.DataAnnotations;

namespace Resourcia.Api.Models.Auth;

public class ResetPasswordModel
{
    [Required]
    [EmailAddress]
    public string Email { get; set; } = null!;
    public string Token { get; set; } = null!;
    public string NewPassword { get; set; }
}
