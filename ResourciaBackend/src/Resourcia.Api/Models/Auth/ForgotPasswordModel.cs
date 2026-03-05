using System.ComponentModel.DataAnnotations;

public sealed class ForgotPasswordModel
{
    [Required]
    [EmailAddress]
    [StringLength(256)] // matches common Identity limits
    public string Email { get; set; } = default!;
}