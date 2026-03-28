using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Resourcia.Data.Entities;

public class ResourceImage
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public Guid ResourceId { get; set; }
    public Resource Resource { get; set; } = null!;
    public string FileName { get; set; } = string.Empty; // random safe filename
    public string OriginalFileName { get; set; } = string.Empty; // optional
    public string ContentType { get; set; } = string.Empty; // image/png, image/jpeg
    public DateTime UploadedAtUtc { get; set; } = DateTime.UtcNow;
    public Guid UploadedByUserId { get; set; }
    public bool IsDeleted { get; set; } = false;
    public DateTime? DeletedAtUtc { get; set; }
    public Guid? DeletedByUserId { get; set; }

}
