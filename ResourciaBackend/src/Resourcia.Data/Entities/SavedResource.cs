using Resourcia.Data.Entities.Identity;

namespace Resourcia.Data.Entities;

public class SavedResource
{
    public Guid UserId { get; set; }
    public AppUser User { get; set; } = null!;

    public Guid ResourceId { get; set; }
    public Resource Resource { get; set; } = null!;

    public DateTime CreatedAtUtc { get; set; } = DateTime.UtcNow;
}
