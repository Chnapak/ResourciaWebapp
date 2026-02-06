using NodaTime;
using System.ComponentModel.DataAnnotations.Schema;

namespace Resourcia.Data.Entities.Identity;

[Table(nameof(RefreshToken))]
public class RefreshToken
{
    public Guid Id { get; set; }
    public Guid UserId { get; set; }
    public required string Token { get; set; }
    public Instant CreatedAt { get; set; }
    public Instant ExpiresAt { get; set; }
    public Instant? RevokedAt { get; set; }
    public string? RequestInfo { get; set; }
}
