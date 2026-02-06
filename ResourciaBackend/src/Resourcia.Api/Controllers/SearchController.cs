using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Resourcia.Data;

namespace Resourcia.Api.Controllers;

[Route("api/[controller]")]
[ApiController]
public class SearchController : ControllerBase
{
    private readonly AppDbContext _db;
    public SearchController(AppDbContext db)
    {
        _db = db;
    }

    [HttpGet("Schema")]
    public async Task<IActionResult> Schema()
    {
        var filters = await _db.Filters
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
                    .Select(v => new
                    {
                        v.Value,
                        v.Label
                    })
            }).ToListAsync();

        return Ok(new { filters });
    }
}
