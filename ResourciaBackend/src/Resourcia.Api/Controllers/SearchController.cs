using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Resourcia.Api.Models.Filters;
using Resourcia.Api.Services;
using Resourcia.Data;

namespace Resourcia.Api.Controllers;

[Route("api/[controller]")]
[ApiController]
public class SearchController(AppDbContext db, CacheService cache) : ControllerBase
{
    private readonly AppDbContext _db = db;
    private readonly CacheService _cache = cache;

    [HttpGet("Schema")]
    public async Task<IActionResult> Schema()
    {
        var response = await _cache.GetOrSetAsync(
            "search:schema:v2",
            async () =>
            {
                var filters = await _db.Filters
                    .AsNoTracking()
                    .Where(filter => filter.IsActive)
                    .OrderBy(filter => filter.SortOrder)
                    .Select(filter => new SearchSchemaFilterModel
                    {
                        Key = filter.Key,
                        Label = filter.Label,
                        Kind = filter.Kind.ToString().ToLowerInvariant(),
                        IsMulti = filter.IsMulti,
                        ResourceField = filter.ResourceField,
                        Values = filter.FacetValues
                            .Where(value => value.IsActive && value.ResourceFacetValues.Any())
                            .OrderBy(value => value.SortOrder)
                            .Select(value => new SearchSchemaFilterValueModel
                            {
                                Value = value.Value,
                                Label = value.Label
                            })
                            .ToList()
                    })
                    .ToListAsync();

                var populatedFilters = new List<SearchSchemaFilterModel>();

                foreach (var filter in filters)
                {
                    if (await HasDataAsync(filter))
                    {
                        populatedFilters.Add(filter);
                    }
                }

                return new SearchSchemaResponseModel
                {
                    Filters = populatedFilters
                };
            },
            TimeSpan.FromHours(1));

        return Ok(response);
    }

    [HttpGet("SchemaDebug")]
    public async Task<IActionResult> SchemaDebug()
    {
        var total = await _db.Filters.CountAsync();
        var active = await _db.Filters.CountAsync(filter => filter.IsActive);
        var sample = await _db.Filters
            .AsNoTracking()
            .OrderBy(filter => filter.SortOrder)
            .Select(filter => new { filter.Key, filter.IsActive })
            .Take(20)
            .ToListAsync();

        return Ok(new { total, active, sample });
    }

    private async Task<bool> HasDataAsync(SearchSchemaFilterModel filter)
    {
        if (string.Equals(filter.Kind, "facet", StringComparison.OrdinalIgnoreCase))
        {
            return filter.Values.Count > 0;
        }

        if (string.IsNullOrWhiteSpace(filter.ResourceField))
        {
            return false;
        }

        return filter.ResourceField.Trim().ToLowerInvariant() switch
        {
            "author" => await _db.Resources.AsNoTracking().AnyAsync(resource => resource.Author != null && resource.Author != string.Empty),
            "createdby" => await _db.Resources.AsNoTracking().AnyAsync(resource => resource.CreatedBy != null && resource.CreatedBy != string.Empty),
            "description" => await _db.Resources.AsNoTracking().AnyAsync(resource => resource.Description != null && resource.Description != string.Empty),
            "isfree" => await _db.Resources.AsNoTracking().AnyAsync(resource => resource.IsFree),
            "learningstyle" => await _db.Resources.AsNoTracking().AnyAsync(resource => resource.LearningStyle != string.Empty),
            "rating" => await _db.ResourceRatings.AsNoTracking().AnyAsync(rating => rating.TotalCount > 0),
            "savescount" => await _db.Resources.AsNoTracking().AnyAsync(resource => resource.SavesCount > 0),
            "tags" => await _db.Resources.AsNoTracking().AnyAsync(resource => resource.Tags.Count > 0),
            "title" => await _db.Resources.AsNoTracking().AnyAsync(resource => resource.Title != string.Empty),
            "url" => await _db.Resources.AsNoTracking().AnyAsync(resource => resource.Url != string.Empty),
            "year" => await _db.Resources.AsNoTracking().AnyAsync(resource => resource.Year.HasValue),
            _ => false
        };
    }
}
