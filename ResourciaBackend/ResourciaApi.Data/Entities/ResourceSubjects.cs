using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Resourcia.Data.Entities;
public class ResourceSubject
{
    [Key]
    public required Guid Id { get; set; }

    [ForeignKey(nameof(Resource))]
    public required Guid ResourceId { get; set; }
    public Resource Resource { get; set; } = null!;

    [ForeignKey(nameof(Subject))]
    public required Guid SubjectId { get; set; }
    public Subject Subject { get; set; } = null!;
}
