using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Resourcia.Api.Models.Admin;
using Resourcia.Api.Services;
using Resourcia.Data;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;

namespace Resourcia.Api.Controllers;

[Route("api/admin/resources")]
[ApiController]
[Authorize(Roles = "Admin")]
public class AdminResourcesController : ControllerBase
{
    private readonly AppDbContext _dbContext;
    private readonly CacheService _cache;

    public AdminResourcesController(AppDbContext dbContext, CacheService cache)
    {
        _dbContext = dbContext;
        _cache = cache;
    }

    [HttpGet]
    public async Task<IActionResult> GetResources(int page = 1, int pageSize = 25)
    {
        page = Math.Max(page, 1);
        pageSize = Math.Clamp(pageSize, 1, 100);

        var query = _dbContext.Resources
            .IgnoreQueryFilters()
            .AsNoTracking()
            .OrderByDescending(resource => resource.UpdatedAtUtc)
            .Select(resource => new AdminResourceModel
            {
                Id = resource.Id,
                Title = resource.Title,
                Url = resource.Url,
                CreatedBy = resource.CreatedBy,
                SavesCount = resource.SavesCount,
                ReviewCount = resource.ResourceReviews.Count,
                CreatedAtUtc = resource.CreatedAtUtc,
                UpdatedAtUtc = resource.UpdatedAtUtc,
                IsDeleted = resource.DeletedAtUtc != null,
                DeletedAtUtc = resource.DeletedAtUtc
            });

        var totalCount = await query.CountAsync();
        var items = await query
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .ToListAsync();

        return Ok(new
        {
            items,
            totalCount,
            page,
            pageSize
        });
    }

    [HttpDelete("{id:guid}")]
    public async Task<IActionResult> SoftDeleteResource(Guid id)
    {
        var resource = await _dbContext.Resources
            .IgnoreQueryFilters()
            .FirstOrDefaultAsync(currentResource => currentResource.Id == id);

        if (resource == null)
        {
            return NotFound();
        }

        if (resource.DeletedAtUtc != null)
        {
            return NotFound("Resource is already deleted.");
        }

        resource.DeletedAtUtc = DateTime.UtcNow;
        resource.DeletedBy = GetCurrentDisplayName() ?? "Admin";
        resource.UpdatedAtUtc = DateTime.UtcNow;

        await _dbContext.SaveChangesAsync();

        await _cache.InvalidateAsync($"resource:v5:{id}");
        await _cache.InvalidateAsync($"threads:{id}");
        await _cache.InvalidateNamespaceAsync("search-results");
        await InvalidateSearchSchemaAsync();

        return NoContent();
    }

    private async Task InvalidateSearchSchemaAsync()
    {
        await _cache.InvalidateAsync("search:schema");
        await _cache.InvalidateAsync("search:schema:v2");
        await _cache.InvalidateAsync("search:schema:v3");
        await _cache.InvalidateAsync("search:schema:v4");
        await _cache.InvalidateAsync("search:schema:v5");
    }

    private string? GetCurrentDisplayName()
    {
        if (User.Identity?.IsAuthenticated != true)
            return null;

        return User.FindFirstValue(ClaimTypes.Name)
            ?? User.FindFirstValue(JwtRegisteredClaimNames.Name);
    }
}
