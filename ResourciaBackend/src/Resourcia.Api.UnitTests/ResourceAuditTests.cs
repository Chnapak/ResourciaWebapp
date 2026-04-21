using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Security.Claims;
using System.Threading;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Diagnostics;
using Microsoft.Extensions.Caching.Distributed;
using Microsoft.Extensions.Caching.Memory;
using Microsoft.Extensions.Logging.Abstractions;
using Resourcia.Api.Controllers;
using Resourcia.Api.Models.Audit;
using Resourcia.Api.Models.Resources;
using Resourcia.Api.Services;
using Resourcia.Data;
using Resourcia.Data.Entities;
using Xunit;

namespace Resourcia.Api.UnitTests;

public class ResourceAuditTests
{
    private static AppDbContext CreateDbContext(string dbName)
    {
        var options = new DbContextOptionsBuilder<AppDbContext>()
            .ConfigureWarnings((warnings) => warnings.Ignore(InMemoryEventId.TransactionIgnoredWarning))
            .UseInMemoryDatabase(dbName)
            .Options;
        return new AppDbContext(options);
    }

    private static DefaultHttpContext CreateHttpContext(Guid userId, string name, bool isAdmin)
    {
        var claims = new List<Claim>
        {
            new(ClaimTypes.NameIdentifier, userId.ToString()),
            new(ClaimTypes.Name, name)
        };

        if (isAdmin)
        {
            claims.Add(new Claim(ClaimTypes.Role, "Admin"));
        }

        var identity = new ClaimsIdentity(claims, "TestAuth");
        var principal = new ClaimsPrincipal(identity);

        return new DefaultHttpContext
        {
            User = principal
        };
    }

    [Fact]
    public async Task Create_resource_writes_audit_entry()
    {
        await using var db = CreateDbContext(nameof(Create_resource_writes_audit_entry));
        var cache = new CacheService(new MemoryDistributedCache(Microsoft.Extensions.Options.Options.Create(new MemoryDistributedCacheOptions())));
        var imageService = new ImageService(Path.Combine(Directory.GetCurrentDirectory(), "wwwroot", "uploads"));
        var auditService = new ResourceAuditService(db, NullLogger<ResourceAuditService>.Instance);
        var controller = new ResourceController(db, imageService, cache, auditService, NullLogger<ResourceController>.Instance)
        {
            ControllerContext = new ControllerContext
            {
                HttpContext = CreateHttpContext(Guid.NewGuid(), "Test User", false)
            }
        };

        var request = new CreateResourceModel
        {
            Title = "Intro to Testing",
            Url = "https://example.com",
            Description = "A test resource",
            Tags = new List<string> { "test" }
        };

        var result = await controller.Create(request, CancellationToken.None);

        Assert.IsType<CreatedAtActionResult>(result);
        var entry = await db.ResourceAuditEntries.FirstOrDefaultAsync();
        Assert.NotNull(entry);
        Assert.Equal(ResourceAuditActionType.Create, entry!.ActionType);
        Assert.Null(entry.BeforeJson);
        Assert.False(string.IsNullOrWhiteSpace(entry.AfterJson));
    }

    [Fact]
    public async Task Update_resource_writes_audit_entry()
    {
        await using var db = CreateDbContext(nameof(Update_resource_writes_audit_entry));
        var cache = new CacheService(new MemoryDistributedCache(Microsoft.Extensions.Options.Options.Create(new MemoryDistributedCacheOptions())));
        var imageService = new ImageService(Path.Combine(Directory.GetCurrentDirectory(), "wwwroot", "uploads"));
        var auditService = new ResourceAuditService(db, NullLogger<ResourceAuditService>.Instance);
        var controller = new ResourceController(db, imageService, cache, auditService, NullLogger<ResourceController>.Instance)
        {
            ControllerContext = new ControllerContext
            {
                HttpContext = CreateHttpContext(Guid.NewGuid(), "Owner User", false)
            }
        };

        var resource = new Resource
        {
            Title = "Original",
            Url = "https://example.com",
            LearningStyle = "Reading",
            Tags = new List<string>(),
            CreatedBy = "Owner User",
            CreatedAtUtc = DateTime.UtcNow,
            UpdatedAtUtc = DateTime.UtcNow
        };

        db.Resources.Add(resource);
        await db.SaveChangesAsync();

        var result = await controller.Update(resource.Id, new UpdateResourceModel { Title = "Updated" }, CancellationToken.None);

        Assert.IsType<OkObjectResult>(result);
        var entry = await db.ResourceAuditEntries.FirstOrDefaultAsync();
        Assert.NotNull(entry);
        Assert.Equal(ResourceAuditActionType.Update, entry!.ActionType);
        Assert.Contains("\"title\"", entry.DiffJson ?? string.Empty);
    }

    [Fact]
    public async Task Soft_delete_writes_audit_entry()
    {
        await using var db = CreateDbContext(nameof(Soft_delete_writes_audit_entry));
        var cache = new CacheService(new MemoryDistributedCache(Microsoft.Extensions.Options.Options.Create(new MemoryDistributedCacheOptions())));
        var auditService = new ResourceAuditService(db, NullLogger<ResourceAuditService>.Instance);
        var controller = new AdminResourcesController(db, cache, auditService, NullLogger<AdminResourcesController>.Instance)
        {
            ControllerContext = new ControllerContext
            {
                HttpContext = CreateHttpContext(Guid.NewGuid(), "Admin User", true)
            }
        };

        var resource = new Resource
        {
            Title = "Delete Me",
            Url = "https://example.com",
            LearningStyle = "Reading",
            Tags = new List<string>(),
            CreatedBy = "Owner",
            CreatedAtUtc = DateTime.UtcNow,
            UpdatedAtUtc = DateTime.UtcNow
        };

        db.Resources.Add(resource);
        await db.SaveChangesAsync();

        var result = await controller.SoftDeleteResource(resource.Id);

        Assert.IsType<NoContentResult>(result);
        var entry = await db.ResourceAuditEntries.FirstOrDefaultAsync();
        Assert.NotNull(entry);
        Assert.Equal(ResourceAuditActionType.SoftDelete, entry!.ActionType);
    }

    [Fact]
    public async Task Revert_restores_snapshot_and_logs_warning_for_missing_image()
    {
        await using var db = CreateDbContext(nameof(Revert_restores_snapshot_and_logs_warning_for_missing_image));
        var cache = new CacheService(new MemoryDistributedCache(Microsoft.Extensions.Options.Options.Create(new MemoryDistributedCacheOptions())));
        var auditService = new ResourceAuditService(db, NullLogger<ResourceAuditService>.Instance);
        var controller = new ResourceAuditController(db, auditService, cache, NullLogger<ResourceAuditController>.Instance)
        {
            ControllerContext = new ControllerContext
            {
                HttpContext = CreateHttpContext(Guid.NewGuid(), "Admin User", true)
            }
        };

        var resource = new Resource
        {
            Title = "Current Title",
            Url = "https://example.com",
            LearningStyle = "Reading",
            Tags = new List<string>(),
            CreatedBy = "Owner",
            CreatedAtUtc = DateTime.UtcNow,
            UpdatedAtUtc = DateTime.UtcNow,
            Images = new List<ResourceImage>
            {
                new ResourceImage
                {
                    FileName = "missing-file.png",
                    OriginalFileName = "missing-file.png",
                    ContentType = "image/png",
                    UploadedAtUtc = DateTime.UtcNow,
                    UploadedByUserId = Guid.NewGuid()
                }
            }
        };

        db.Resources.Add(resource);
        await db.SaveChangesAsync();

        var snapshot = new ResourceAuditSnapshot
        {
            Id = resource.Id,
            Title = "Restored Title",
            Description = resource.Description,
            Url = resource.Url,
            IsFree = resource.IsFree,
            Year = resource.Year,
            Author = resource.Author,
            LearningStyle = resource.LearningStyle,
            Tags = resource.Tags,
            CreatedBy = resource.CreatedBy,
            DeletedAtUtc = resource.DeletedAtUtc,
            DeletedBy = resource.DeletedBy,
            FilterValues = new List<ResourceAuditFilterValue>(),
            Images = resource.Images.Select(image => new ResourceAuditImage
            {
                Id = image.Id,
                FileName = image.FileName,
                OriginalFileName = image.OriginalFileName,
                ContentType = image.ContentType,
                UploadedAtUtc = image.UploadedAtUtc,
                UploadedByUserId = image.UploadedByUserId,
                IsDeleted = false,
                DeletedAtUtc = null,
                DeletedByUserId = null
            }).ToList()
        };

        var auditEntry = auditService.BuildEntry(
            resource.Id,
            ResourceAuditActionType.Update,
            null,
            snapshot,
            "admin",
            null,
            null,
            null,
            null);

        db.ResourceAuditEntries.Add(auditEntry);
        await db.SaveChangesAsync();

        var result = await controller.Revert(resource.Id, new ResourceRevertRequest
        {
            AuditId = auditEntry.Id,
            Reason = "Rollback"
        }, CancellationToken.None);

        Assert.IsType<OkObjectResult>(result);

        var updatedResource = await db.Resources.IgnoreQueryFilters().Include(r => r.Images).FirstAsync();
        Assert.Equal("Restored Title", updatedResource.Title);
        Assert.True(updatedResource.Images.First().IsDeleted);

        var revertEntry = await db.ResourceAuditEntries
            .OrderByDescending(entry => entry.CreatedAtUtc)
            .FirstAsync();

        Assert.Equal(ResourceAuditActionType.Revert, revertEntry.ActionType);
        Assert.Contains("Image file missing", revertEntry.DiffJson ?? string.Empty);
    }
}
