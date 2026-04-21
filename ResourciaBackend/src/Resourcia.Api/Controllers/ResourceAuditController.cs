using System.Security.Claims;
using System.IdentityModel.Tokens.Jwt;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Resourcia.Api.Models.Audit;
using Resourcia.Api.Services;
using Resourcia.Data;
using Resourcia.Data.Entities;

namespace Resourcia.Api.Controllers;

[ApiController]
[Route("api/resources/{resourceId:guid}/audit")]
public class ResourceAuditController : ControllerBase
{
    private readonly AppDbContext _dbContext;
    private readonly ResourceAuditService _auditService;
    private readonly CacheService _cache;
    private readonly ILogger<ResourceAuditController> _logger;

    public ResourceAuditController(
        AppDbContext dbContext,
        ResourceAuditService auditService,
        CacheService cache,
        ILogger<ResourceAuditController> logger)
    {
        _dbContext = dbContext;
        _auditService = auditService;
        _cache = cache;
        _logger = logger;
    }

    [Authorize]
    [HttpGet]
    public async Task<IActionResult> GetAudit(Guid resourceId, int page = 1, int pageSize = 20, CancellationToken ct = default)
    {
        var resource = await _dbContext.Resources
            .IgnoreQueryFilters()
            .AsNoTracking()
            .FirstOrDefaultAsync(r => r.Id == resourceId, ct);

        if (resource == null)
        {
            return NotFound();
        }

        if (!CanViewAudit(resource))
        {
            return Forbid();
        }

        page = Math.Max(page, 1);
        pageSize = Math.Clamp(pageSize, 1, 100);

        var query = _dbContext.ResourceAuditEntries
            .AsNoTracking()
            .Where(entry => entry.ResourceId == resourceId);

        var totalCount = await query.CountAsync(ct);

        var items = await query
            .OrderByDescending(entry => entry.CreatedAtUtc)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .Select(entry => new ResourceAuditEntryListItem
            {
                Id = entry.Id,
                ActionType = entry.ActionType,
                CreatedAtUtc = entry.CreatedAtUtc,
                ActorDisplayName = entry.ActorDisplayName,
                ActorRole = entry.ActorRole,
                Source = entry.Source,
                Reason = entry.Reason,
                RevertedAuditId = entry.RevertedAuditId
            })
            .ToListAsync(ct);

        return Ok(new ResourceAuditEntryListResponse
        {
            ResourceId = resource.Id,
            ResourceTitle = resource.Title,
            IsDeleted = resource.DeletedAtUtc != null,
            Items = items,
            TotalCount = totalCount,
            Page = page,
            PageSize = pageSize
        });
    }

    [Authorize]
    [HttpGet("{auditId:guid}")]
    public async Task<IActionResult> GetAuditEntry(Guid resourceId, Guid auditId, CancellationToken ct = default)
    {
        var resource = await _dbContext.Resources
            .IgnoreQueryFilters()
            .AsNoTracking()
            .FirstOrDefaultAsync(r => r.Id == resourceId, ct);

        if (resource == null)
        {
            return NotFound();
        }

        if (!CanViewAudit(resource))
        {
            return Forbid();
        }

        var entry = await _dbContext.ResourceAuditEntries
            .AsNoTracking()
            .FirstOrDefaultAsync(e => e.ResourceId == resourceId && e.Id == auditId, ct);

        if (entry == null)
        {
            return NotFound();
        }

        return Ok(new ResourceAuditEntryDetail
        {
            Id = entry.Id,
            ActionType = entry.ActionType,
            CreatedAtUtc = entry.CreatedAtUtc,
            ActorDisplayName = entry.ActorDisplayName,
            ActorRole = entry.ActorRole,
            Source = entry.Source,
            Reason = entry.Reason,
            RevertedAuditId = entry.RevertedAuditId,
            Before = _auditService.DeserializeSnapshot(entry.BeforeJson),
            After = _auditService.DeserializeSnapshot(entry.AfterJson),
            Diff = _auditService.DeserializeDiff(entry.DiffJson)
        });
    }

    [Authorize(Roles = "Admin")]
    [HttpPost("/api/resources/{resourceId:guid}/revert")]
    public async Task<IActionResult> Revert(Guid resourceId, [FromBody] ResourceRevertRequest request, CancellationToken ct)
    {
        if (request == null || request.AuditId == Guid.Empty)
        {
            return BadRequest(new { error = "AuditId is required." });
        }

        if (string.IsNullOrWhiteSpace(request.Reason))
        {
            return BadRequest(new { error = "Reason is required." });
        }

        var auditEntry = await _dbContext.ResourceAuditEntries
            .AsNoTracking()
            .FirstOrDefaultAsync(entry => entry.ResourceId == resourceId && entry.Id == request.AuditId, ct);

        if (auditEntry == null)
        {
            return NotFound();
        }

        var targetSnapshot = _auditService.DeserializeSnapshot(auditEntry.AfterJson)
            ?? _auditService.DeserializeSnapshot(auditEntry.BeforeJson);

        if (targetSnapshot == null)
        {
            return BadRequest(new { error = "Selected audit entry does not contain a snapshot to restore." });
        }

        var resource = await _dbContext.Resources
            .IgnoreQueryFilters()
            .Include(r => r.ResourceFilterValues)
            .Include(r => r.Images)
            .FirstOrDefaultAsync(r => r.Id == resourceId, ct);

        if (resource == null)
        {
            return NotFound();
        }

        var beforeSnapshot = await _auditService.BuildSnapshotAsync(resourceId, ct);

        var warnings = new List<string>();
        ApplySnapshot(resource, targetSnapshot, warnings);

        resource.UpdatedAtUtc = DateTime.UtcNow;

        _dbContext.ResourceFilterValues.RemoveRange(resource.ResourceFilterValues);
        resource.ResourceFilterValues.Clear();

        if (targetSnapshot.FilterValues.Count > 0)
        {
            var newValues = targetSnapshot.FilterValues.Select(value => new ResourceFilterValues
            {
                ResourceId = resource.Id,
                Resource = resource,
                FilterDefinitionsId = value.FilterDefinitionsId,
                FacetValuesId = value.FacetValuesId,
                StringValue = value.StringValue,
                NumberValue = value.NumberValue,
                BooleanValue = value.BooleanValue
            }).ToList();

            _dbContext.ResourceFilterValues.AddRange(newValues);
        }

        ApplyImages(resource, targetSnapshot.Images, warnings);

        await _dbContext.SaveChangesAsync(ct);

        await _cache.InvalidateAsync($"resource:v5:{resourceId}");
        await _cache.InvalidateAsync($"threads:{resourceId}");
        await _cache.InvalidateNamespaceAsync("search-results");

        var afterSnapshot = await _auditService.BuildSnapshotAsync(resourceId, ct);
        var entry = _auditService.BuildEntry(
            resourceId,
            ResourceAuditActionType.Revert,
            beforeSnapshot,
            afterSnapshot,
            "admin",
            HttpContext,
            request.Reason,
            request.AuditId,
            warnings);

        await _auditService.TryWriteEntryAsync(entry, ct);

        return Ok(new { resource.Id });
    }

    private bool CanViewAudit(Resource resource)
    {
        if (User.IsInRole("Admin"))
        {
            return true;
        }

        if (User.Identity?.IsAuthenticated == true && resource.DeletedAtUtc == null)
        {
            return true;
        }

        var name = GetCurrentDisplayName();
        if (string.IsNullOrWhiteSpace(name) || string.IsNullOrWhiteSpace(resource.CreatedBy))
        {
            return false;
        }

        return string.Equals(name, resource.CreatedBy, StringComparison.OrdinalIgnoreCase);
    }

    private string? GetCurrentDisplayName()
    {
        if (User.Identity?.IsAuthenticated != true)
        {
            return null;
        }

        return User.FindFirstValue(ClaimTypes.Name)
            ?? User.FindFirstValue(JwtRegisteredClaimNames.Name);
    }

    private void ApplySnapshot(Resource resource, ResourceAuditSnapshot snapshot, List<string> warnings)
    {
        resource.Title = snapshot.Title;
        resource.Description = snapshot.Description;
        resource.Url = snapshot.Url;
        resource.IsFree = snapshot.IsFree;
        resource.Year = snapshot.Year;
        resource.Author = snapshot.Author;
        resource.LearningStyle = snapshot.LearningStyle;
        resource.Tags = snapshot.Tags ?? new List<string>();
        resource.CreatedBy = snapshot.CreatedBy;
        resource.DeletedAtUtc = snapshot.DeletedAtUtc;
        resource.DeletedBy = snapshot.DeletedBy;
    }

    private void ApplyImages(Resource resource, List<ResourceAuditImage> snapshotImages, List<string> warnings)
    {
        var imageRoot = Path.Combine(Directory.GetCurrentDirectory(), "wwwroot", "uploads");
        var snapshotById = snapshotImages.ToDictionary(image => image.Id, image => image);

        var removedImages = resource.Images.Where(image => !snapshotById.ContainsKey(image.Id)).ToList();
        if (removedImages.Count > 0)
        {
            _dbContext.ResourceImages.RemoveRange(removedImages);
        }

        foreach (var snapshotImage in snapshotImages)
        {
            var existing = resource.Images.FirstOrDefault(image => image.Id == snapshotImage.Id);

            var filePath = Path.Combine(imageRoot, snapshotImage.FileName);
            var isMissing = !System.IO.File.Exists(filePath);

            if (isMissing)
            {
                warnings.Add($"Image file missing: {snapshotImage.FileName}");
                _logger.LogWarning("Missing image file during revert: {FileName}", snapshotImage.FileName);
            }

            if (existing == null)
            {
                var newImage = new ResourceImage
                {
                    Id = snapshotImage.Id,
                    ResourceId = resource.Id,
                    Resource = resource,
                    FileName = snapshotImage.FileName,
                    OriginalFileName = snapshotImage.OriginalFileName,
                    ContentType = snapshotImage.ContentType,
                    UploadedAtUtc = snapshotImage.UploadedAtUtc,
                    UploadedByUserId = snapshotImage.UploadedByUserId,
                    IsDeleted = isMissing || snapshotImage.IsDeleted,
                    DeletedAtUtc = isMissing ? DateTime.UtcNow : snapshotImage.DeletedAtUtc,
                    DeletedByUserId = snapshotImage.DeletedByUserId
                };

                _dbContext.ResourceImages.Add(newImage);
            }
            else
            {
                existing.FileName = snapshotImage.FileName;
                existing.OriginalFileName = snapshotImage.OriginalFileName;
                existing.ContentType = snapshotImage.ContentType;
                existing.UploadedAtUtc = snapshotImage.UploadedAtUtc;
                existing.UploadedByUserId = snapshotImage.UploadedByUserId;
                existing.IsDeleted = isMissing || snapshotImage.IsDeleted;
                existing.DeletedAtUtc = isMissing ? DateTime.UtcNow : snapshotImage.DeletedAtUtc;
                existing.DeletedByUserId = snapshotImage.DeletedByUserId;
            }
        }
    }
}
