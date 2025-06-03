using NodaTime;
using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations.Schema;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Resourcia.Data.Entities;
[Table(nameof(EmailMessage))]
public class EmailMessage
{
    public Guid Id { get; set; }
    public required string RecipientEmail { get; set; }
    public string? RecipientName { get; set; }
    public required string Subject { get; set; }
    public required string Body { get; set; }
    public bool Sent { get; set; }
    public Instant CreatedAt { get; set; }
    public required string FromEmail { get; set; }
    public required string FromName { get; set; }
}