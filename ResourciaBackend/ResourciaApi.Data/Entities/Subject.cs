using Microsoft.AspNetCore.Http.HttpResults;
using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using NodaTime;

namespace Resourcia.Data.Entities;

public class Subject
{
    public required Guid Id { get; set; }
    public required string Name { get; set; } = null!;

    [MaxLength(255)]
    public string Description { get; set; }
    public bool AbandondedSubject { get; set; } = false;
    public int CodeIdentifier { get; set; }
    public Guid ParentId { get; set; }
    public required Instant CreatedAt { get; set; }
    public ICollection<ResourceSubject> ResourceSubjects { get; set; }
}
