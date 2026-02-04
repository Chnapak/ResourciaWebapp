using System.ComponentModel.DataAnnotations;

namespace Resourcia.Api.Models.Auth;

public class ResendConfirmationModel
{
    [Required]
    [EmailAddress]
    public string Email { get; set; }
}
