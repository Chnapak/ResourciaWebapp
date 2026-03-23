namespace Resourcia.Api.Models.Admin;

public class AdminSuspensionModel
{
    public string reason { get; set; } = null!;
    public int durationDays { get; set; }
}
