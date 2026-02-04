using Microsoft.AspNetCore.Mvc;
using System.Collections.Generic;
using Resourcia.Data.Entities;
using Resourcia.Api.Models.Resources;
using Microsoft.EntityFrameworkCore;
using Resourcia.Data;
using Resourcia.Api.Services.Interfaces;
using Resourcia.Api.Services;

namespace Resourcia.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class ResourceController(AppDbContext dbContext, IDeweyService deweyService) : ControllerBase
{
    private AppDbContext _dbContext = dbContext;
    private IDeweyService _deweyService = deweyService;

    [HttpPost(Name = "CreateResource")]
    public async Task<ActionResult<Resource>> Create([FromBody] CreateResourceModel model)
    {
        var newEntity = new Resource
        {
            Id = Guid.NewGuid(),
            Name = model.Name,
            Url = model.Url,
            AvailabilityTag = model.AvailabilityTag,
            TopicId = await _deweyService.ConvertFromStandardDewey(model.DeweyNumber, model.Digits),
        };

        _dbContext.Add(newEntity);
        await _dbContext.SaveChangesAsync();

        newEntity = await _dbContext.Resources.FirstAsync(x => x.Id == newEntity.Id);

        return Ok();
    }

    [HttpGet(Name = "GetResources")]
    public async Task<ActionResult<IEnumerable<Resource>>> Get()
    {
        var resources = await _dbContext.Resources.ToListAsync();
        return Ok(resources);
    }

    [HttpPost("{resourceId}/add-subject", Name = "AddSubjectToResource")]
    public async Task<ActionResult<Resource>> AddSubjectToResource(Guid resourceId, Guid subjectId)
    {
        if (subjectId == null)
        {
            return BadRequest("Subject model is required.");
        }

        var resource = await _dbContext.Resources.FirstOrDefaultAsync(r => r.Id == resourceId);
        if (resource == null)
        {
            return NotFound("Resource not found.");
        }

        var source = await _dbContext.Subjects.FirstOrDefaultAsync(r => r.Id == subjectId);
        if (source == null)
        {
            return NotFound("Resource not found.");
        }

        // Add to ResourceSubjects join table
        var resourceSubject = new ResourceSubject
        {
            Id = Guid.NewGuid(),
            ResourceId = resource.Id,
            SubjectId = source.Id
        };

        _dbContext.Set<ResourceSubject>().Add(resourceSubject);
        await _dbContext.SaveChangesAsync();

        return Ok(resource);
    }

}
