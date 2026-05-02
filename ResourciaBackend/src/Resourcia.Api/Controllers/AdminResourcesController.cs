using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Resourcia.Api.Models.Admin;
using Resourcia.Api.Services;
using Resourcia.Api.Models.Audit;
using Resourcia.Data;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using Resourcia.Data.Entities;

namespace Resourcia.Api.Controllers;

[Route("api/admin/resources")]
[ApiController]
[Authorize(Roles = "Admin")]
public class AdminResourcesController : ControllerBase
{
    private readonly AppDbContext _dbContext;
    private readonly CacheService _cache;
    private readonly ResourceAuditService _auditService;
    private readonly ILogger<AdminResourcesController> _logger;

    public AdminResourcesController(
        AppDbContext dbContext,
        CacheService cache,
        ResourceAuditService auditService,
        ILogger<AdminResourcesController> logger)
    {
        _dbContext = dbContext;
        _cache = cache;
        _auditService = auditService;
        _logger = logger;
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

        var beforeSnapshot = await _auditService.BuildSnapshotAsync(id, HttpContext.RequestAborted);

        resource.DeletedAtUtc = DateTime.UtcNow;
        resource.DeletedBy = GetCurrentDisplayName() ?? "Admin";
        resource.UpdatedAtUtc = DateTime.UtcNow;

        await _dbContext.SaveChangesAsync();

        await _cache.InvalidateAsync($"resource:v6:{id}");
        await _cache.InvalidateAsync($"threads:{id}");
        await _cache.InvalidateNamespaceAsync("search-results");
        await InvalidateSearchSchemaAsync();

        var afterSnapshot = await _auditService.BuildSnapshotAsync(id, HttpContext.RequestAborted);
        await TryWriteAuditAsync(id, ResourceAuditActionType.SoftDelete, beforeSnapshot, afterSnapshot, "admin", null, null, null, HttpContext.RequestAborted);

        return NoContent();
    }

    [HttpPost("{id:guid}/restore")]
    public async Task<IActionResult> RestoreResource(Guid id)
    {
        var resource = await _dbContext.Resources
            .IgnoreQueryFilters()
            .FirstOrDefaultAsync(currentResource => currentResource.Id == id);

        if (resource == null)
        {
            return NotFound();
        }

        if (resource.DeletedAtUtc == null)
        {
            return BadRequest("Resource is not deleted.");
        }

        var beforeSnapshot = await _auditService.BuildSnapshotAsync(id, HttpContext.RequestAborted);

        resource.DeletedAtUtc = null;
        resource.DeletedBy = null;
        resource.UpdatedAtUtc = DateTime.UtcNow;

        await _dbContext.SaveChangesAsync();

        await _cache.InvalidateAsync($"resource:v6:{id}");
        await _cache.InvalidateAsync($"threads:{id}");
        await _cache.InvalidateNamespaceAsync("search-results");
        await InvalidateSearchSchemaAsync();

        var afterSnapshot = await _auditService.BuildSnapshotAsync(id, HttpContext.RequestAborted);
        await TryWriteAuditAsync(id, ResourceAuditActionType.Restore, beforeSnapshot, afterSnapshot, "admin", null, null, null, HttpContext.RequestAborted);

        return NoContent();
    }

    private async Task InvalidateSearchSchemaAsync()
    {
        await _cache.InvalidateAsync("search:schema");
        await _cache.InvalidateAsync("search:schema:v2");
        await _cache.InvalidateAsync("search:schema:v3");
        await _cache.InvalidateAsync("search:schema:v4");
        await _cache.InvalidateAsync("search:schema:v5");
        await _cache.InvalidateAsync("search:schema:v6");
        await _cache.InvalidateAsync("resource:schema:v1");
        await _cache.InvalidateAsync("resource:schema:v2");
    }

    private string? GetCurrentDisplayName()
    {
        if (User.Identity?.IsAuthenticated != true)
            return null;

        return User.FindFirstValue(ClaimTypes.Name)
            ?? User.FindFirstValue(JwtRegisteredClaimNames.Name);
    }

    private async Task TryWriteAuditAsync(
        Guid resourceId,
        ResourceAuditActionType actionType,
        ResourceAuditSnapshot? before,
        ResourceAuditSnapshot? after,
        string source,
        string? reason,
        Guid? revertedAuditId,
        IReadOnlyList<string>? warnings,
        CancellationToken ct)
    {
        try
        {
            var entry = _auditService.BuildEntry(
                resourceId,
                actionType,
                before,
                after,
                source,
                HttpContext,
                reason,
                revertedAuditId,
                warnings);

            await _auditService.TryWriteEntryAsync(entry, ct);
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "Failed to write audit entry for resource {ResourceId}.", resourceId);
        }
    }
}
