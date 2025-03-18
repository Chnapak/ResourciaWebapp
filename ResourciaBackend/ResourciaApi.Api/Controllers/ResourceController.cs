using Microsoft.AspNetCore.Mvc;
using System.Collections.Generic;
using ResourciaApi.Data;
using Resourcia.Data.Entities;
using Resourcia.Api.Models.Resources;
using Microsoft.EntityFrameworkCore;
using Resourcia.Data;

namespace Resourcia.Api.Controllers;

[ApiController]
[Route("[controller]")]
public class ResourceController(AppDbContext dbContext) : ControllerBase
{
    private AppDbContext _dbContext = dbContext;

    [HttpPost(Name = "CreateResource")]
    public async Task<ActionResult<Resource>> Create([FromBody] CreateResourceModel model)
    {
        var newEntity = new Resource
        {
            Id = Guid.NewGuid(),
            Name = model.Name,
            Url = model.Url,
            AvailabilityTag = model.AvailabilityTag,
            Description = string.Empty
        };

        _dbContext.Add(newEntity);
        await _dbContext.SaveChangesAsync();

        newEntity = await _dbContext.Resources.FirstAsync(x => x.Id == newEntity.Id);

        return CreatedAtAction("Get", new { id = newEntity.Id }, newEntity);
    }
}
