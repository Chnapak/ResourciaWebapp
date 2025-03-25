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
[Route("[controller]")]
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
            Description = string.Empty,
            TopicId = await _deweyService.ConvertFromStandardDewey(model.DeweyNumber, model.Digits),
        };

        _dbContext.Add(newEntity);
        await _dbContext.SaveChangesAsync();

        newEntity = await _dbContext.Resources.FirstAsync(x => x.Id == newEntity.Id);

        return Ok();
    }
}
