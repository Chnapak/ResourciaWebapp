using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Resourcia.Api.Models.Subject;
using Resourcia.Data;

namespace Resourcia.Api.Controllers.Subject;

[Route("api/[controller]")]
[ApiController]
public class SubjectController : ControllerBase
{
    private readonly AppDbContext _dbContext;

    public SubjectController( AppDbContext dbContext )
    {
        _dbContext = dbContext;
    }

    [HttpPost("Add")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public async Task<ActionResult> Add([FromBody] AddSubjectModel subject) 
    {
        if (string.IsNullOrWhiteSpace(subject.Name))
        {
            return BadRequest("Subject name cannot be empty.");
        }
        var newSubject = new Data.Entities.Subject
        {
            Id = Guid.NewGuid(),
            Name = subject.Name,
            Description = subject.Description,
            CreatedAt = NodaTime.Instant.FromDateTimeUtc(DateTime.UtcNow),
        };
        _dbContext.Subjects.Add(newSubject);
        await _dbContext.SaveChangesAsync();
        return NoContent();
    }

    [HttpGet("GetAll")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public async Task<ActionResult<SubjectSimpleModel>> GetAll()
    {
        var subjects = await _dbContext.Subjects
            .Where(s => s.AbandondedSubject == false)
            .Select(s => new SubjectSimpleModel
            {
                Id = s.Id,
                Name = s.Name
            }).ToListAsync();

        return Ok(subjects);
    }
}
