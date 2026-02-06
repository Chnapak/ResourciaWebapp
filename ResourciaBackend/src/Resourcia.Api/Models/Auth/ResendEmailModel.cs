using System.ComponentModel.DataAnnotations;

namespace Resourcia.Api.Models.Auth;

public class ResendEmailModel
{
    [Required]
    [EmailAddress]
    public string Email { get; set; }
}
