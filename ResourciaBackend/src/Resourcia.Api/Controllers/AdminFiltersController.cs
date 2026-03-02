using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.JsonPatch;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using NodaTime;
using Npgsql;
using Resourcia.Api.Models.Filters;
using Resourcia.Data;
using Resourcia.Data.Entities;

namespace Resourcia.Api.Controllers;

[Route("api/admin/filters")]
[ApiController]
[Authorize(Roles = "Admin")]
public class AdminFiltersController : ControllerBase
{
    private readonly AppDbContext _dbContext;
    private readonly IClock _clock;

    public AdminFiltersController(AppDbContext dbContext, IClock clock)
    {
        _dbContext = dbContext;
        _clock = clock;
    }

    [HttpGet]
    public async Task<ActionResult> GetAllFilters()
    {
        var filters = await _dbContext.Filters
            .OrderBy(f => f.SortOrder)
            .Select(f => new
            {
                f.Id,
                f.Key,
                f.Label,
                f.Description,
                f.Kind,
                f.IsMulti,
                f.IsActive,
                f.SortOrder
            }).ToListAsync();
        return Ok(filters);
    }

    [HttpDelete("{id:guid}")]
    public async Task<IActionResult> DeleteFilter(Guid id)
    {
        var filter = await _dbContext.Filters.FindAsync(id);
        if (filter == null)
        {
            return NotFound();
        }
        filter.IsActive = false;
        await _dbContext.SaveChangesAsync();
        return NoContent();
    }

    [HttpPost]
    public async Task<ActionResult<FilterDefinitions>> CreateFilter([FromBody] CreateFilterDefinitionModel createRequest)
    {
        var exists = await _dbContext.Filters
            .AnyAsync(f => f.Key == createRequest.Key);

        if (exists)
        {
            return Conflict($"Filter with key '{createRequest.Key}' already exists.");

        }

        var filter = new FilterDefinitions
        {
            Key = createRequest.Key,
            Label = createRequest.Label,
            Description = createRequest.Description,
            Kind = createRequest.Kind,
            IsMulti = createRequest.IsMulti,
            IsActive = false
        };

        _dbContext.Filters.Add(filter);
        await _dbContext.SaveChangesAsync();

        return Ok(new { filter.Id });
    }

    // TODO: Patch instead of Put
    [HttpPatch("{id:guid}")]
    public async Task<ActionResult<FilterDefinitions>> PatchFilter(Guid id, [FromBody] JsonPatchDocument<CreateFilterDefinitionModel> patchDoc)
    {
        if (patchDoc == null)
            return BadRequest("No patch document provided.");

        var filter = await _dbContext.Filters.FindAsync(id);
        if (filter == null)
            return NotFound($"Filter with id '{id}' not found.");

        var filterDto = new CreateFilterDefinitionModel
        {
            Key = filter.Key,
            Label = filter.Label,
            Description = filter.Description,
            Kind = filter.Kind,
            IsMulti = filter.IsMulti
        };
        // Apply the patch to the entity
        patchDoc.ApplyTo(filterDto);

        // Validate after applying patch
        if (!TryValidateModel(filterDto))
            return ValidationProblem(ModelState);

        filter.Key = filterDto.Key;
        filter.Label = filterDto.Label;
        filter.Description = filterDto.Description;
        filter.Kind = filterDto.Kind;
        filter.IsMulti = filterDto.IsMulti;

        try
        {
            await _dbContext.SaveChangesAsync();
        }
        catch (DbUpdateException ex) when (ex.InnerException is PostgresException pg && pg.SqlState == "23505")
        {
            return Conflict($"A filter with key '{filterDto.Key}' already exists.");
        }

        return Ok(filter);
    }

    [HttpPatch("{id:guid}/active")]
    public async Task<IActionResult> SetFilter(Guid id, [FromBody] ActivationFilterModel activation)
    {
        var filter = await _dbContext.Filters.FindAsync(id);
        if (filter == null)
            return NotFound();

        filter.IsActive = activation.IsActive;
        await _dbContext.SaveChangesAsync();

        return NoContent();
    }
}
