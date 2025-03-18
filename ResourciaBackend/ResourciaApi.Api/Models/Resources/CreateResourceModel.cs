using System.ComponentModel.DataAnnotations;
using Resourcia.Data.Entities;


namespace Resourcia.Api.Models.Resources;

public class CreateResourceModel
{
    [Required(AllowEmptyStrings = false, ErrorMessage = "Příspěvek musí mít nějaký text!")]

    public string Name { get; set; } = null!;
    public string Url { get; set; } = null!;
    public int AvailabilityTag { get; set; }
}
