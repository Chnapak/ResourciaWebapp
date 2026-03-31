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
    public async Task<ActionResult<List<FilterInfoModel>>> GetAllFilters()
    {
        var filters = await _dbContext.Filters
            .Where(f => f.DeletedAt == null)
            .Select(f => new FilterInfoModel
            {
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
                    .Select(v => new FilterFacetValueInfoModel
                    {
                        Id = v.Id,
                        Value = v.Value,
                        Label = v.Label,
                        SortOrder = v.SortOrder
                    })
                    .ToList()
            })
            .ToListAsync();
        Console.WriteLine(filters);
        return Ok(filters);
    }

    // Optional: GET: api/filters/{filterName}/values
    [HttpGet("{filterName}")]
    public async Task<ActionResult<IEnumerable<string>>> GetFilterValues(string filterName)
    {
        var filter = await _dbContext.Filters
            .Include(f => f.FacetValues)
            .FirstOrDefaultAsync(f => f.Key == filterName && f.DeletedAt == null);

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
}

