using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.JsonPatch;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Query.SqlExpressions;
using Npgsql;
using Resourcia.Api.Models.Filters;
using Resourcia.Data;
using Resourcia.Data.Entities;

namespace Resourcia.Api.Controllers;

[Route("api/[controller]")]
[ApiController]
public class FilterController(AppDbContext dbContext) : ControllerBase
{
    private AppDbContext _dbContext = dbContext;

    [HttpGet]
    public async Task<ActionResult<FilterInfoModel>> GetAllFilters()
    {
        var filters = await _dbContext.Filters
            .Select(f => new FilterInfoModel
            {
                Key = f.Key,
                Label = f.Label,
                Description = f.Description,
                Kind = f.Kind,
                IsMulti = f.IsMulti,
                IsActive = f.IsActive,
                SortOrder = f.SortOrder,
                FacetValues = f.FacetValues.Where(v => v.IsActive).OrderBy(v => v.SortOrder).ToList()
            })
            .ToListAsync();
        return Ok(filters);
    }

    // Optional: GET: api/filters/{filterName}/values
    [HttpGet("{filterName}")]
    public async Task<ActionResult<IEnumerable<string>>> GetFilterValues(string filterName)
    {
        var filter = await _dbContext.Filters
            .Include(f => f.FacetValues)
            .FirstOrDefaultAsync(f => f.Key == filterName);

        if (filter == null)
            return NotFound($"Filter '{filterName}' not found.");

        var values = filter.FacetValues
               .Where(v => v.IsActive)
               .OrderBy(v => v.SortOrder)
               .Select(v => new
               {
                   v.Id,
                   v.Value,
                   v.Label
               })
               .ToList();

        return Ok(values); // assuming Values is a collection of strings
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
            IsMulti = createRequest.IsMulti
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

    [HttpDelete("{id:guid}")]
    public async Task<IActionResult> DeleteFilter(Guid id)
    {
        var filter = await _dbContext.Filters.FindAsync(id);
        if (filter == null)
        {
            return NotFound();
        }
        _dbContext.Filters.Remove(filter);
        await _dbContext.SaveChangesAsync();
        return NoContent();
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

