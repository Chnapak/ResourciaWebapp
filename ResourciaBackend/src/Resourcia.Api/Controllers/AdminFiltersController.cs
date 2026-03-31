using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.JsonPatch;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using NodaTime;
using Npgsql;
using Resourcia.Api.Models.Admin;
using Resourcia.Api.Models.Filters;
using Resourcia.Api.Services;
using Resourcia.Api.Utils;
using Resourcia.Data;
using Resourcia.Data.Entities;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;

namespace Resourcia.Api.Controllers;

[Route("api/admin/filters")]
[ApiController]
[Authorize(Roles = "Admin")]
public class AdminFiltersController : ControllerBase
{
    private readonly AppDbContext _dbContext;
    private readonly IClock _clock;
    private readonly CacheService _cache;

    public AdminFiltersController(AppDbContext dbContext, IClock clock, CacheService cache)
    {
        _dbContext = dbContext;
        _clock = clock;
        _cache = cache;
    }



    [HttpGet]
    public async Task<ActionResult> GetAllFilters()
    {
        var filters = await _dbContext.Filters
            .Where(f => f.DeletedAt == null)
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
                ResourceField = f.ResourceField,

                FacetValues = f.FacetValues
                    .Where(v => v.IsActive)
                    .OrderBy(v => v.SortOrder)
                    .Select(v => new FilterFacetValueInfoModel
                    {
                        Id = v.Id,
                        Value = v.Value,
                        Label = v.Label,
                        SortOrder = v.SortOrder
                    })
                    .ToList(),

                // ✅ DISTINCT RESOURCE COUNT
                ResourceCount = f.ResourceFilterValues
                    .Where(resourceFilterValue => resourceFilterValue.Resource.DeletedAtUtc == null)
                    .Select(resourceFilterValue => resourceFilterValue.ResourceId)
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

    [HttpPut("{id:guid}")]
    public async Task<ActionResult<FilterInfoModel>> UpdateFilter(Guid id, [FromBody] UpdateFilterDefinitionModel request)
    {
        if (!ModelState.IsValid)
            return ValidationProblem(ModelState);

        var filter = await _dbContext.Filters
            .Include(f => f.FacetValues)
            .SingleOrDefaultAsync(f => f.Id == id && f.DeletedAt == null);

        if (filter == null)
            return NotFound($"Filter with id '{id}' not found.");

        var trimmedLabel = request.Label.Trim();
        if (string.IsNullOrWhiteSpace(trimmedLabel))
            return BadRequest("Label is required.");

        filter.Label = trimmedLabel;
        filter.Description = string.IsNullOrWhiteSpace(request.Description)
            ? null
            : request.Description.Trim();
        filter.ResourceField = filter.Kind == FilterKind.Facet
            ? null
            : FilterResourceFieldResolver.Resolve(filter.ResourceField, filter.Key, filter.Label);

        var duplicateLabels = request.FacetValues
            .Select(facetValue => facetValue.Label?.Trim())
            .Where(label => !string.IsNullOrWhiteSpace(label))
            .GroupBy(label => label!, StringComparer.OrdinalIgnoreCase)
            .Where(group => group.Count() > 1)
            .Select(group => group.Key)
            .ToList();

        if (duplicateLabels.Count > 0)
            return BadRequest(new { error = "Facet values must be unique.", values = duplicateLabels });

        var hasFacetValues = request.FacetValues.Any(facetValue => !string.IsNullOrWhiteSpace(facetValue.Label));
        if (filter.Kind == FilterKind.Facet && filter.IsActive && !hasFacetValues)
        {
            return BadRequest(new
            {
                error = "Active facet filters need at least one possible value."
            });
        }

        SyncFacetValues(filter, request.FacetValues);

        filter.ModifiedAt = _clock.GetCurrentInstant();
        filter.ModifiedBy = GetCurrentDisplayName();

        await _dbContext.SaveChangesAsync();
        await InvalidateSearchSchemaAsync();

        var updatedFilter = await _dbContext.Filters
            .AsNoTracking()
            .Where(f => f.Id == id && f.DeletedAt == null)
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
                ResourceField = f.ResourceField,
                FacetValues = f.FacetValues
                    .Where(v => v.IsActive)
                    .OrderBy(v => v.SortOrder)
                    .Select(v => new FilterFacetValueInfoModel
                    {
                        Id = v.Id,
                        Value = v.Value,
                        Label = v.Label,
                        SortOrder = v.SortOrder
                    })
                    .ToList(),
                ResourceCount = f.ResourceFilterValues
                    .Where(resourceFilterValue => resourceFilterValue.Resource.DeletedAtUtc == null)
                    .Select(resourceFilterValue => resourceFilterValue.ResourceId)
                    .Distinct()
                    .Count(),
                CreatedAt = f.CreatedAt,
                CreatedBy = f.CreatedBy,
                LastChangeAt = f.ModifiedAt ?? f.CreatedAt,
                ModifiedBy = f.ModifiedBy
            })
            .SingleAsync();

        return Ok(updatedFilter);
    }

    [HttpDelete("{id:guid}")]
    public async Task<IActionResult> DeleteFilter(Guid id)
    {
        var filter = await _dbContext.Filters
            .SingleOrDefaultAsync(currentFilter => currentFilter.Id == id && currentFilter.DeletedAt == null);
        if (filter == null)
        {
            return NotFound();
        }
        filter.IsActive = false;
        filter.DeletedAt = _clock.GetCurrentInstant();
        filter.DeletedBy = GetCurrentDisplayName();
        filter.ModifiedAt = filter.DeletedAt;
        filter.ModifiedBy = filter.DeletedBy;
        await _dbContext.SaveChangesAsync();
        await InvalidateSearchSchemaAsync();
        return NoContent();
    }

    [HttpPost]
    public async Task<ActionResult<FilterInfoModel>> CreateFilter([FromBody] CreateFilterDefinitionModel createRequest)
    {
        if (!ModelState.IsValid)
            return ValidationProblem(ModelState);

        var trimmedKey = createRequest.Key.Trim();
        var trimmedLabel = createRequest.Label.Trim();

        if (string.IsNullOrWhiteSpace(trimmedKey))
            return BadRequest("Key is required.");

        if (string.IsNullOrWhiteSpace(trimmedLabel))
            return BadRequest("Label is required.");

        var exists = await _dbContext.Filters
            .AnyAsync(f => f.Key == trimmedKey);

        if (exists)
        {
            return Conflict($"Filter with key '{trimmedKey}' already exists.");
        }

        var trimmedFacetValues = createRequest.FacetValues
            .Select((facetValue, index) => new
            {
                Label = facetValue.Label.Trim(),
                SortOrder = index
            })
            .Where(facetValue => !string.IsNullOrWhiteSpace(facetValue.Label))
            .ToList();

        var duplicateFacetValues = trimmedFacetValues
            .GroupBy(facetValue => facetValue.Label, StringComparer.OrdinalIgnoreCase)
            .Where(group => group.Count() > 1)
            .Select(group => group.Key)
            .ToList();

        if (duplicateFacetValues.Count > 0)
            return BadRequest(new { error = "Facet values must be unique.", values = duplicateFacetValues });

        var resolvedResourceField = createRequest.Kind == FilterKind.Facet
            ? null
            : FilterResourceFieldResolver.Resolve(createRequest.ResourceField, trimmedKey, trimmedLabel);

        if (createRequest.Kind == FilterKind.Facet && createRequest.IsActive && trimmedFacetValues.Count == 0)
        {
            return BadRequest(new
            {
                error = "Active facet filters need at least one possible value."
            });
        }

        var filter = new FilterDefinitions
        {
            Key = trimmedKey,
            Label = trimmedLabel,
            Description = string.IsNullOrWhiteSpace(createRequest.Description)
                ? null
                : createRequest.Description.Trim(),
            Kind = createRequest.Kind,
            IsMulti = createRequest.IsMulti,
            ResourceField = resolvedResourceField,
            IsActive = createRequest.IsActive,
            CreatedAt = _clock.GetCurrentInstant(),
            CreatedBy = GetCurrentDisplayName() ?? "system"
        };

        if (trimmedFacetValues.Count > 0)
        {
            foreach (var facetValue in trimmedFacetValues)
            {
                filter.FacetValues.Add(new FacetValues
                {
                    FilterDefinitionsId = filter.Id,
                    Value = GenerateFacetValueKey(facetValue.Label),
                    Label = facetValue.Label,
                    IsActive = true,
                    SortOrder = facetValue.SortOrder
                });
            }
        }

        _dbContext.Filters.Add(filter);
        await _dbContext.SaveChangesAsync();
        await InvalidateSearchSchemaAsync();

        return Ok(new FilterInfoModel
        {
            Id = filter.Id,
            Key = filter.Key,
            Label = filter.Label,
            Description = filter.Description,
            Kind = filter.Kind,
            IsMulti = filter.IsMulti,
            IsActive = filter.IsActive,
            SortOrder = filter.SortOrder,
            ResourceField = filter.ResourceField,
            FacetValues = filter.FacetValues
                .OrderBy(facetValue => facetValue.SortOrder)
                .Select(facetValue => new FilterFacetValueInfoModel
                {
                    Id = facetValue.Id,
                    Value = facetValue.Value,
                    Label = facetValue.Label,
                    SortOrder = facetValue.SortOrder
                })
                .ToList(),
            ResourceCount = 0,
            CreatedAt = filter.CreatedAt,
            CreatedBy = filter.CreatedBy,
            LastChangeAt = filter.CreatedAt,
            ModifiedBy = filter.ModifiedBy
        });
    }

    // TODO: Patch instead of Put
    [HttpPatch("{id:guid}")]
    public async Task<ActionResult<FilterDefinitions>> PatchFilter(Guid id, [FromBody] JsonPatchDocument<CreateFilterDefinitionModel> patchDoc)
    {
        if (patchDoc == null)
            return BadRequest("No patch document provided.");

        var filter = await _dbContext.Filters
            .SingleOrDefaultAsync(currentFilter => currentFilter.Id == id && currentFilter.DeletedAt == null);
        if (filter == null)
            return NotFound($"Filter with id '{id}' not found.");

        var filterDto = new CreateFilterDefinitionModel
        {
            Key = filter.Key,
            Label = filter.Label,
            Description = filter.Description,
            Kind = filter.Kind,
            IsMulti = filter.IsMulti,
            ResourceField = filter.ResourceField
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
        filter.ResourceField = filterDto.ResourceField;
        filter.ModifiedAt = _clock.GetCurrentInstant();
        filter.ModifiedBy = GetCurrentDisplayName();

        try
        {
            await _dbContext.SaveChangesAsync();
            await InvalidateSearchSchemaAsync();
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
        var filter = await _dbContext.Filters
            .Include(currentFilter => currentFilter.FacetValues)
            .SingleOrDefaultAsync(currentFilter => currentFilter.Id == id && currentFilter.DeletedAt == null);

        if (filter == null)
            return NotFound();

        var nextIsActive = !filter.IsActive;

        if (filter.Kind != FilterKind.Facet)
        {
            filter.ResourceField = FilterResourceFieldResolver.Resolve(filter.ResourceField, filter.Key, filter.Label);
        }
        else
        {
            filter.ResourceField = null;
        }

        if (filter.Kind == FilterKind.Facet && nextIsActive && !filter.FacetValues.Any(facetValue => facetValue.IsActive))
        {
            return BadRequest(new
            {
                error = "Active facet filters need at least one possible value."
            });
        }

        filter.IsActive = nextIsActive;
        filter.ModifiedAt = _clock.GetCurrentInstant();
        filter.ModifiedBy = GetCurrentDisplayName();
        await _dbContext.SaveChangesAsync();
        await InvalidateSearchSchemaAsync();

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

        var moved = await _dbContext.Filters.SingleOrDefaultAsync(f => f.Id == model.movedId && f.DeletedAt == null);
        if (moved is null) return NotFound($"Filter '{model.movedId}' not found.");

        FilterDefinitions? above = null;
        FilterDefinitions? below = null;

        if (model.aboveId is not null)
        {
            above = await _dbContext.Filters.SingleOrDefaultAsync(f => f.Id == model.aboveId.Value && f.DeletedAt == null);
            if (above is null) return NotFound($"Filter aboveId '{model.aboveId}' not found.");
        }

        if (model.belowId is not null)
        {
            below = await _dbContext.Filters.SingleOrDefaultAsync(f => f.Id == model.belowId.Value && f.DeletedAt == null);
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
                above = await _dbContext.Filters.SingleAsync(f => f.Id == model.aboveId!.Value && f.DeletedAt == null);
                below = await _dbContext.Filters.SingleAsync(f => f.Id == model.belowId!.Value && f.DeletedAt == null);
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

        moved.ModifiedAt = _clock.GetCurrentInstant();
        moved.ModifiedBy = GetCurrentDisplayName();
        await _dbContext.SaveChangesAsync();
        await InvalidateSearchSchemaAsync();
        return Ok(new { moved.Id, moved.SortOrder });
    }

    private async Task ReindexAllFilters(decimal step)
    {
        var filters = await _dbContext.Filters
            .Where(f => f.DeletedAt == null)
            .OrderBy(f => f.SortOrder)
            .ToListAsync();

        for (var i = 0; i < filters.Count; i++)
            filters[i].SortOrder = (i + 1) * step;

        await _dbContext.SaveChangesAsync();
    }

    private void SyncFacetValues(FilterDefinitions filter, IEnumerable<UpdateFacetValueModel> requestedFacetValues)
    {
        var incomingFacetValues = requestedFacetValues
            .Select((facetValue, index) => new
            {
                facetValue.Id,
                Label = facetValue.Label.Trim(),
                SortOrder = index
            })
            .Where(facetValue => !string.IsNullOrWhiteSpace(facetValue.Label))
            .ToList();

        var retainedFacetValueIds = new HashSet<Guid>();
        var existingFacetValuesById = filter.FacetValues.ToDictionary(facetValue => facetValue.Id);

        foreach (var incomingFacetValue in incomingFacetValues)
        {
            FacetValues? facetValue = null;
            var isNewFacetValue = false;

            if (incomingFacetValue.Id.HasValue && existingFacetValuesById.TryGetValue(incomingFacetValue.Id.Value, out var existingFacetValue))
            {
                facetValue = existingFacetValue;
            }
            else
            {
                var generatedValue = GenerateFacetValueKey(incomingFacetValue.Label);
                facetValue = filter.FacetValues.FirstOrDefault(existingValue =>
                    string.Equals(existingValue.Value, generatedValue, StringComparison.OrdinalIgnoreCase));

                if (facetValue == null)
                {
                    facetValue = new FacetValues
                    {
                        FilterDefinitionsId = filter.Id,
                        Value = generatedValue,
                        Label = incomingFacetValue.Label,
                        IsActive = true,
                        SortOrder = incomingFacetValue.SortOrder
                    };

                    filter.FacetValues.Add(facetValue);
                    isNewFacetValue = true;
                }
            }

            if (isNewFacetValue)
            {
                _dbContext.Entry(facetValue).State = EntityState.Added;
            }

            facetValue.Label = incomingFacetValue.Label;
            facetValue.IsActive = true;
            facetValue.SortOrder = incomingFacetValue.SortOrder;
            retainedFacetValueIds.Add(facetValue.Id);
        }

        foreach (var facetValue in filter.FacetValues)
        {
            if (!retainedFacetValueIds.Contains(facetValue.Id))
            {
                facetValue.IsActive = false;
            }
        }
    }

    private static string GenerateFacetValueKey(string label)
    {
        var characters = label
            .Trim()
            .ToLowerInvariant()
            .Select(ch => char.IsLetterOrDigit(ch) ? ch : '-')
            .ToArray();

        var compact = new string(characters);

        while (compact.Contains("--", StringComparison.Ordinal))
        {
            compact = compact.Replace("--", "-", StringComparison.Ordinal);
        }

        compact = compact.Trim('-');

        if (compact.Length == 0)
            compact = "value";

        return compact.Length > 128 ? compact[..128].TrimEnd('-') : compact;
    }

    private async Task InvalidateSearchSchemaAsync()
    {
        await _cache.InvalidateAsync("search:schema");
        await _cache.InvalidateAsync("search:schema:v2");
        await _cache.InvalidateAsync("search:schema:v3");
        await _cache.InvalidateAsync("search:schema:v4");
        await _cache.InvalidateAsync("search:schema:v5");
        await _cache.InvalidateAsync("resource:schema:v1");
    }

    private string? GetCurrentDisplayName()
    {
        if (User.Identity?.IsAuthenticated != true)
            return null;

        return User.FindFirstValue(ClaimTypes.Name)
            ?? User.FindFirstValue(JwtRegisteredClaimNames.Name);
    }
}
