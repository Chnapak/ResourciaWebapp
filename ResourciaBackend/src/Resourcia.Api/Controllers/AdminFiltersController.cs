using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.JsonPatch;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using NodaTime;
using Npgsql;
using Resourcia.Api.Models.Admin;
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
            .Select(f => new FilterInfoModel
            {
                Id = f.Id,
                Key = f.Key,
                Label = f.Label,
                Description = f.Description,
                Kind = f.Kind,
                IsMulti = f.IsMulti,
                IsActive = f.IsActive,
                SortOrder = f.SortOrder,

                FacetValues = f.FacetValues
                    .Where(v => v.IsActive)
                    .OrderBy(v => v.SortOrder)
                    .ToList(),

                // ✅ DISTINCT RESOURCE COUNT
                ResourceCount = f.FacetValues
                    .Where(v => v.IsActive)
                    .SelectMany(v => v.ResourceFacetValues)
                    .Select(rf => rf.ResourceId)
                    .Distinct()
                    .Count(),

                CreatedAt = f.CreatedAt,
                CreatedBy = f.CreatedBy,
                LastChangeAt = f.ModifiedAt ?? f.CreatedAt,
                ModifiedBy = f.ModifiedBy
            })
            .ToListAsync();

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

    [HttpPatch("{id:guid}/toggleActivity")]
    public async Task<IActionResult> ToggleFilter(Guid id)
    {
        var filter = await _dbContext.Filters.FindAsync(id);
        if (filter == null)
            return NotFound();

        filter.IsActive = !filter.IsActive;
        await _dbContext.SaveChangesAsync();

        return Ok(new
        {
            filter.Id,
            filter.IsActive
        });

    }

    [HttpPatch("reorder")]
    public async Task<IActionResult> ReorderFilters([FromBody] FractionalIndexingModel model)
    {
        if (model.aboveId is null && model.belowId is null)
            return BadRequest("At least one of aboveId or belowId must be provided.");
        if (model.aboveId is not null && model.belowId is not null && model.aboveId == model.belowId)
            return BadRequest("aboveId and belowId cannot be the same.");

        var moved = await _dbContext.Filters.SingleOrDefaultAsync(f => f.Id == model.movedId);
        if (moved is null) return NotFound($"Filter '{model.movedId}' not found.");

        FilterDefinitions? above = null;
        FilterDefinitions? below = null;

        if (model.aboveId is not null)
        {
            above = await _dbContext.Filters.SingleOrDefaultAsync(f => f.Id == model.aboveId.Value);
            if (above is null) return NotFound($"Filter aboveId '{model.aboveId}' not found.");
        }

        if (model.belowId is not null)
        {
            below = await _dbContext.Filters.SingleOrDefaultAsync(f => f.Id == model.belowId.Value);
            if (below is null) return NotFound($"Filter belowId '{model.belowId}' not found.");
        }

        // Optional sanity check: ensure above is actually above below
        if (above is not null && below is not null && above.SortOrder >= below.SortOrder)
        {
            // This can happen if client sent stale neighbors or IDs swapped.
            return BadRequest("Invalid neighbors: above must have SortOrder < below.");
        }

        const decimal step = 10m;
        const decimal minGap = 0.000001m; // depends on your precision

        // If we need a key between two items, ensure there's space; else reindex.
        if (above is not null && below is not null)
        {
            var gap = below.SortOrder - above.SortOrder;
            if (gap <= minGap)
            {
                await ReindexAllFilters(step);
                // Reload neighbor keys after reindex
                above = await _dbContext.Filters.SingleAsync(f => f.Id == model.aboveId!.Value);
                below = await _dbContext.Filters.SingleAsync(f => f.Id == model.belowId!.Value);
            }

            moved.SortOrder = (above.SortOrder + below.SortOrder) / 2m;
        }
        else if (above is null && below is not null)
        {
            // Move to top (before below)
            moved.SortOrder = below.SortOrder - step;
        }
        else if (above is not null && below is null)
        {
            // Move to bottom (after above)
            moved.SortOrder = above.SortOrder + step;
        }

        await _dbContext.SaveChangesAsync();
        return Ok(new { moved.Id, moved.SortOrder });
    }

    private async Task ReindexAllFilters(decimal step)
    {
        var filters = await _dbContext.Filters
        .OrderBy(f => f.SortOrder)
        .ToListAsync();

        for (var i = 0; i < filters.Count; i++)
            filters[i].SortOrder = (i + 1) * step;

        await _dbContext.SaveChangesAsync();
    }
}
