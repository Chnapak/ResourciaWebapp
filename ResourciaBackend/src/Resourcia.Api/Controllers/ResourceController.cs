using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Resourcia.Api.Models.Resources;
using Resourcia.Data;
using Resourcia.Data.Entities;

namespace Resourcia.Api.Controllers;

[Route("api/[controller]")]
[ApiController]
public class ResourceController(AppDbContext dbContext) : ControllerBase
{
    private AppDbContext _dbContext = dbContext;

    [HttpPost]
    public async Task<IActionResult> Create([FromBody] CreateResourceModel req, CancellationToken ct)
    {
        // Basic validation
        if (string.IsNullOrWhiteSpace(req.Title))
            return BadRequest(new { error = "Title is required." });

        if (string.IsNullOrWhiteSpace(req.Url))
            return BadRequest(new { error = "Url is required." });

        // Normalize facet keys + values
        var facetKeys = req.Facets.Keys
            .Select(k => k.Trim())
            .Where(k => k.Length > 0)
            .Distinct(StringComparer.OrdinalIgnoreCase)
            .ToList();

        // Load filter definitions for provided keys
        var defs = facetKeys.Count == 0
            ? new List<FilterDefinitions>()
            : await _dbContext.Set<FilterDefinitions>()
                .Where(d => facetKeys.Contains(d.Key) && d.IsActive)
                .ToListAsync(ct);

        var defByKey = defs.ToDictionary(d => d.Key, d => d, StringComparer.OrdinalIgnoreCase);

        // Unknown keys?
        var unknownKeys = facetKeys.Where(k => !defByKey.ContainsKey(k)).ToList();
        if (unknownKeys.Count > 0)
            return BadRequest(new { error = "Unknown or disabled facet keys.", keys = unknownKeys });

        // Ensure all provided defs are Facet kind
        var nonFacet = defs.Where(d => d.Kind != FilterKind.Facet).Select(d => d.Key).ToList();
        if (nonFacet.Count > 0)
            return BadRequest(new { error = "These keys are not facet filters.", keys = nonFacet });

        // Validate IsMulti constraints
        var multiViolations = req.Facets
            .Select(kvp =>
            {
                var def = defByKey[kvp.Key];
                var values = (kvp.Value ?? new List<string>())
                    .Where(v => !string.IsNullOrWhiteSpace(v))
                    .Select(v => v.Trim())
                    .Distinct(StringComparer.OrdinalIgnoreCase)
                    .ToList();
                return new { def.Key, def.IsMulti, Count = values.Count };
            })
            .Where(x => !x.IsMulti && x.Count > 1)
            .Select(x => x.Key)
            .ToList();

        if (multiViolations.Count > 0)
            return BadRequest(new { error = "Multiple values provided for single-value facet.", keys = multiViolations });

        // Create resource entity
        var resource = new Resource
        {
            Title = req.Title.Trim(),
            Description = req.Description,
            Url = req.Url.Trim(),
            IsFree = req.IsFree ?? false,
            Year = req.Year,
            Author = req.Author,
            LearningStyle = req.LearningStyle ?? string.Empty,
            Tags = req.Tags ?? new List<string>(),
            Rating = req.Rating,
            CreatedAtUtc = DateTime.UtcNow,
            UpdatedAtUtc = DateTime.UtcNow
        };

        // Resolve FacetValues for all requested facet assignments
        var facetRequests = req.Facets
            .Select(kvp => new
            {
                Key = kvp.Key.Trim(),
                Def = defByKey[kvp.Key],
                Values = (kvp.Value ?? new List<string>())
                    .Where(v => !string.IsNullOrWhiteSpace(v))
                    .Select(v => v.Trim())
                    .Distinct(StringComparer.OrdinalIgnoreCase)
                    .ToList()
            })
            .Where(x => x.Values.Count > 0)
            .ToList();

        var defIds = facetRequests.Select(x => x.Def.Id).Distinct().ToList();

        // Pull all facet values for these defs once, then match in memory
        var allowedFacetValues = defIds.Count == 0
            ? new List<FacetValues>()
            : await _dbContext.Set<FacetValues>()
                .Where(fv => defIds.Contains(fv.FilterDefinitionsId) && fv.IsActive)
                .ToListAsync(ct);

        var joins = new List<ResourceFacetValues>();

        foreach (var fr in facetRequests)
        {
            var matches = allowedFacetValues
                .Where(fv => fv.FilterDefinitionsId == fr.Def.Id &&
                             fr.Values.Contains(fv.Value, StringComparer.OrdinalIgnoreCase))
                .ToList();

            // Missing slugs?
            var found = matches.Select(m => m.Value).ToHashSet(StringComparer.OrdinalIgnoreCase);
            var missing = fr.Values.Where(v => !found.Contains(v)).ToList();
            if (missing.Count > 0)
                return BadRequest(new { error = $"Invalid facet values for '{fr.Key}'.", values = missing });

            joins.AddRange(matches.Select(m => new ResourceFacetValues
            {
                ResourceId = resource.Id,
                FacetValuesId = m.Id
            }));
        }

        // Transaction: insert resource + join rows
        await using var tx = await _dbContext.Database.BeginTransactionAsync(ct);

        _dbContext.Set<Resource>().Add(resource);
        if (joins.Count > 0)
            _dbContext.Set<ResourceFacetValues>().AddRange(joins);

        try
        {
            await _dbContext.SaveChangesAsync(ct);
            await tx.CommitAsync(ct);
        }
        catch (DbUpdateException e)
        {
            await tx.RollbackAsync(ct);
            return Conflict(new { error = "Could not create resource.", detail = e.InnerException?.Message ?? e.Message });
        }

        // Response: return resource + chosen facet slugs per key
        var responseFacets = facetRequests.ToDictionary(
            x => x.Key,
            x => allowedFacetValues
                .Where(fv => fv.FilterDefinitionsId == x.Def.Id && joins.Any(j => j.FacetValuesId == fv.Id))
                .Select(fv => fv.Value)
                .ToList(),
            StringComparer.OrdinalIgnoreCase
        );

        return CreatedAtAction(nameof(GetById), new { id = resource.Id }, new
        {
            resource.Id,
            resource.Title,
            resource.Description,
            resource.Url,
            resource.IsFree,
            resource.Year,
            resource.Author,
            resource.LearningStyle,
            resource.Tags,
            resource.Rating,
            facets = responseFacets
        });
    }

    [HttpGet("{id:guid}")]
    public async Task<IActionResult> GetById(Guid id, CancellationToken ct)
    {
        var resource = await _dbContext.Set<Resource>()
            .AsNoTracking()
            .FirstOrDefaultAsync(r => r.Id == id, ct);

        if (resource is null) return NotFound();

        return Ok(resource);
    }
}
