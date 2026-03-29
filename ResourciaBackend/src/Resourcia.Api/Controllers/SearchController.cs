using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
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
        var filters = await cache.GetOrSetAsync(
            "search:schema",
            () => db.Filters
                .AsNoTracking()
                .Where(f => f.IsActive)
                .OrderBy(f => f.SortOrder)
                .Select(f => new
                {
                    f.Key,
                    f.Label,
                    f.Kind,
                    f.IsMulti,
                    f.ResourceField,
                    Values = f.FacetValues
                        .Where(v => v.IsActive)
                        .OrderBy(v => v.SortOrder)
                        .Select(v => new { v.Value, v.Label })
                })
                .ToListAsync(),
            TimeSpan.FromHours(1)); // schema rarely changes

        return Ok(new { filters });
    }

    [HttpGet("SchemaDebug")]
    public async Task<IActionResult> SchemaDebug()
    {
        // debug endpoint — skip cache, always hit DB
        var total = await db.Filters.CountAsync();
        var active = await db.Filters.CountAsync(f => f.IsActive);
        var sample = await db.Filters.AsNoTracking()
            .OrderBy(f => f.SortOrder)
            .Select(f => new { f.Key, f.IsActive })
            .Take(20)
            .ToListAsync();
        return Ok(new { total, active, sample });
    }
}
