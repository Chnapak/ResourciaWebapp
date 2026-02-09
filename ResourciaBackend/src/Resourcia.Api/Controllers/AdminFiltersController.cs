using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using NodaTime;
using Resourcia.Data;

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
}
