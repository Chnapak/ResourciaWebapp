using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using NodaTime;
using Resourcia.Api.Models.Resources;
using Resourcia.Api.Services;
using Resourcia.Data;
using Resourcia.Data.Entities;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;

namespace Resourcia.Api.Controllers;

[ApiController]
public class ResourceController(AppDbContext dbContext, ImageService imageService, CacheService cache) : ControllerBase
{
    private AppDbContext _dbContext = dbContext;
    private ImageService _imageService = imageService;
    private CacheService _cache = cache;

    [HttpPost("api/resources")]
    public async Task<IActionResult> Create([FromBody] CreateResourceModel req, CancellationToken ct)
    {
        // --- Basic validation ---
        if (string.IsNullOrWhiteSpace(req.Title))
            return BadRequest(new { error = "Title is required." });

        if (string.IsNullOrWhiteSpace(req.Url))
            return BadRequest(new { error = "Url is required." });

        // --- Normalize facet keys + values ---
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

        // --- Create resource entity ---
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
            CreatedBy = GetCurrentDisplayName(),
            CreatedAtUtc = DateTime.UtcNow,
            UpdatedAtUtc = DateTime.UtcNow
        };

        // --- Create linked ratings entity ---
        var ratings = new ResourceRatings
        {
            AverageRating = 0,
            TotalCount = 0,
            Count1 = 0,
            Count2 = 0,
            Count3 = 0,
            Count4 = 0,
            Count5 = 0,
            Resource = resource // ✅ important: link navigation property
        };

        resource.Ratings = ratings; // ← this is what makes it non-null in memory


        // --- Resolve facets ---
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

            var found = matches.Select(m => m.Value).ToHashSet(StringComparer.OrdinalIgnoreCase);
            var missing = fr.Values.Where(v => !found.Contains(v)).ToList();
            if (missing.Count > 0)
                return BadRequest(new { error = $"Invalid facet values for '{fr.Key}'.", values = missing });

            joins.AddRange(matches.Select(m => new ResourceFacetValues
            {
                Resource = resource, // link nav property
                FacetValues = m
            }));
        }

        // --- Transaction: insert resource + ratings + join rows ---
        await using var tx = await _dbContext.Database.BeginTransactionAsync(ct);

        _dbContext.Resources.Add(resource);
        _dbContext.ResourceRatings.Add(ratings);
        if (joins.Count > 0)
            _dbContext.ResourceFacetValues.AddRange(joins);

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
            resource.CreatedBy,
            resource.Tags,
            facets = responseFacets,
            ratings = new
            {
                ratings.AverageRating,
                ratings.TotalCount,
                ratings.Count1,
                ratings.Count2,
                ratings.Count3,
                ratings.Count4,
                ratings.Count5
            }
        });
    }

    [HttpGet("api/resources/{id:guid}")]
    public async Task<IActionResult> GetById(Guid id, CancellationToken ct)
    {
        var resource = await _cache.GetOrSetAsync($"resource:v4:{id}", () =>
        _dbContext.Set<Resource>()
        .Where(r => r.Id == id)
        .Select(r => new
        {
            r.Id,
            r.Title,
            r.Description,
            r.Url,
            r.IsFree,
            r.Year,
            r.Author,
            r.LearningStyle,
            r.SavesCount,
            r.CreatedBy,
            r.CreatedAtUtc,
            r.UpdatedAtUtc,
            Tags = r.Tags,
            Ratings = r.Ratings == null ? null : new
            {
                r.Ratings.Id,
                r.Ratings.AverageRating,
                r.Ratings.TotalCount,
                r.Ratings.Count1,
                r.Ratings.Count2,
                r.Ratings.Count3,
                r.Ratings.Count4,
                r.Ratings.Count5
            },
            Facets = r.ResourceFacetValues
                .Select(rfv => new
                {
                    Key = rfv.FacetValues.FilterDefinitions.Key,
                    Value = rfv.FacetValues.Value,
                    Label = rfv.FacetValues.Label
                }).ToList(),
            Reviews = r.ResourceReviews
                .OrderByDescending(rv => rv.CreatedAt)
                .Select(rv => new
                {
                    rv.Id,
                    Username = rv.User.DisplayName,
                    rv.Rating,
                    rv.Content,
                    rv.CreatedAt,
                    UserVote = (bool?)null,
                    Upvotes = rv.Votes.Count(v => v.IsHelpful),
                    Downvotes = rv.Votes.Count(v => !v.IsHelpful)
                }).ToList()
        })
        .AsNoTracking()
        .FirstOrDefaultAsync(ct),
        TimeSpan.FromMinutes(5));

        if (resource == null) return NotFound();

        return Ok(resource);
    }

    [HttpGet("api/resources/search")]
    public async Task<IActionResult> Search(CancellationToken ct)
    {
        var cacheKey = $"search:v2:{Request.QueryString}";

        var result = await _cache.GetOrSetAsync(cacheKey, async () =>
        {
            var queryParams = Request.Query;

            var dbQuery = _dbContext.Set<Resource>()
                .AsNoTracking()
                .AsQueryable();

            // ----- PAGINATION -----
            var page = 1;
            var pageSize = 20;

            if (queryParams.TryGetValue("page", out var pageValue) &&
                int.TryParse(pageValue, out var parsedPage) &&
                parsedPage > 0)
            {
                page = parsedPage;
            }

            if (queryParams.TryGetValue("pageSize", out var pageSizeValue) &&
                int.TryParse(pageSizeValue, out var parsedPageSize) &&
                parsedPageSize > 0)
            {
                pageSize = Math.Min(parsedPageSize, 100);
            }

            // ----- TEXT SEARCH -----
            if (queryParams.TryGetValue("q", out var qValue))
            {
                var lowerTrimmed = qValue.ToString().Trim().ToLower();

                if (!string.IsNullOrWhiteSpace(lowerTrimmed))
                {
                    dbQuery = dbQuery.Where(r =>
                        r.Title.ToLower().Contains(lowerTrimmed) ||
                        (r.Description != null && r.Description.ToLower().Contains(lowerTrimmed))
                    );
                }
            }

            // ----- DYNAMIC FACETS -----
            var reservedKeys = new HashSet<string>(StringComparer.OrdinalIgnoreCase)
        {
            "q", "page", "pageSize"
        };

            var facetFilters = queryParams
                .Where(p => !reservedKeys.Contains(p.Key))
                .ToDictionary(p => p.Key, p => p.Value.ToList());

            foreach (var filter in facetFilters)
            {
                var key = filter.Key;
                var values = filter.Value
                    .Where(v => !string.IsNullOrWhiteSpace(v))
                    .Select(v => v.Trim())
                    .Distinct(StringComparer.OrdinalIgnoreCase)
                    .ToList();

                if (values.Count == 0) continue;

                dbQuery = dbQuery.Where(r =>
                    r.ResourceFacetValues.Any(rfv =>
                        rfv.FacetValues.FilterDefinitions.Key == key &&
                        values.Contains(rfv.FacetValues.Value)
                    )
                );
            }

            var totalItems = await dbQuery.CountAsync(ct);
            var totalPages = totalItems == 0 ? 0 : (int)Math.Ceiling(totalItems / (double)pageSize);

            if (totalPages > 0 && page > totalPages)
                page = totalPages;

            var items = await dbQuery
                .OrderByDescending(r => r.CreatedAtUtc)
                .Skip((page - 1) * pageSize)
                .Take(pageSize)
                .Select(r => new
                {
                    r.Id,
                    r.Title,
                    r.Description,
                    r.Url,
                    r.IsFree,
                    r.Year,
                    r.Author,
                    r.LearningStyle,
                    r.Tags,
                    r.CreatedBy,
                    r.CreatedAtUtc,
                    Ratings = r.Ratings == null ? null : new
                    {
                        r.Ratings.AverageRating,
                        r.Ratings.TotalCount
                    },
                    Facets = r.ResourceFacetValues
                        .Select(rfv => new
                        {
                            Key = rfv.FacetValues.FilterDefinitions.Key,
                            Value = rfv.FacetValues.Value,
                            Label = rfv.FacetValues.Label
                        }).ToList()
                })
                .ToListAsync(ct);

            return new { items, page, pageSize, totalItems, totalPages };

        }, TimeSpan.FromMinutes(2));

        return Ok(result);
    }


    [HttpGet("api/resources/{id:guid}/rating")]
    public async Task<IActionResult> GetRating(Guid id)
    {
        var rating = await _dbContext.ResourceRatings
            .FirstOrDefaultAsync(r => r.ResourceId == id);

        if (rating == null)
            return Ok(new { average = 0, total = 0 });

        return Ok(rating);
    }

    [HttpGet("api/resources/{id:guid}/threads")]
    public async Task<IActionResult> GetThreads(Guid id)
    {
        var threads = await _cache.GetOrSetAsync(
            $"threads:{id}",
            () => _dbContext.Set<Discussions>()
                .Where(t => t.ResourceId == id)
                .OrderByDescending(t => t.CreatedAt)
                .Select(t => new
                {
                    t.Id,
                    t.Content,
                    t.UserId,
                    t.CreatedAt,
                    Username = t.User.DisplayName,
                    Replies = t.Replies
                        .OrderBy(r => r.CreatedAt)
                        .Select(r => new
                        {
                            r.Id,
                            r.Content,
                            r.UserId,
                            r.CreatedAt,
                            Username = r.User.DisplayName
                        })
                        .ToList()
                })
                .ToListAsync(),
            TimeSpan.FromMinutes(5));

        return Ok(threads);
    }

    [Authorize]
    [HttpPost("api/resources/{id:guid}/threads")]
    public async Task<IActionResult> CreateThread(Guid id, [FromBody] string content)
    {
        if (string.IsNullOrWhiteSpace(content))
            return BadRequest("Content is required.");

        var userIdStr = User.FindFirstValue(ClaimTypes.NameIdentifier);
        if (!Guid.TryParse(userIdStr, out var userId))
            return Unauthorized();

        var resourceExists = await _dbContext.Resources.AnyAsync(r => r.Id == id);
        if (!resourceExists)
            return NotFound("Resource not found.");

        var thread = new Discussions
        {
            Id = Guid.NewGuid(),
            ResourceId = id,
            UserId = userId,
            Content = content.Trim(),
            CreatedAt = SystemClock.Instance.GetCurrentInstant()
        };

        _dbContext.Add(thread);
        await _dbContext.SaveChangesAsync();

        await _cache.InvalidateAsync($"threads:{id}"); // 👈 bust so next GET is fresh

        return Ok(thread);
    }

    [Authorize]
    [HttpPost("/api/threads/{id:guid}/reply")]
    public async Task<IActionResult> Reply(Guid id, [FromBody] string content)
    {
        if (string.IsNullOrWhiteSpace(content))
            return BadRequest("Content is required.");

        var userIdStr = User.FindFirstValue(ClaimTypes.NameIdentifier);
        if (!Guid.TryParse(userIdStr, out var userId))
            return Unauthorized();

        var thread = await _dbContext.Set<Discussions>()
            .FirstOrDefaultAsync(t => t.Id == id);

        if (thread == null)
            return NotFound("Thread not found.");

        var reply = new DiscussionReplies
        {
            Id = Guid.NewGuid(),
            DiscussionId = id,
            UserId = userId,
            Content = content.Trim(),
            CreatedAt = SystemClock.Instance.GetCurrentInstant()
        };

        _dbContext.Add(reply);
        await _dbContext.SaveChangesAsync();

        await _cache.InvalidateAsync($"threads:{thread.ResourceId}");

        return Ok(new
        {
            reply.Id,
            reply.Content,
            reply.UserId,
            reply.CreatedAt
        });
    }

    [Authorize]
    [HttpGet("api/resources/{id:guid}/save-state")]
    public async Task<IActionResult> GetSaveState(Guid id)
    {
        var userIdStr = User.FindFirstValue(ClaimTypes.NameIdentifier);
        if (!Guid.TryParse(userIdStr, out var userId))
            return Unauthorized();

        var resource = await _dbContext.Resources
            .AsNoTracking()
            .Where(r => r.Id == id)
            .Select(r => new { r.Id, r.SavesCount })
            .FirstOrDefaultAsync();

        if (resource == null)
            return NotFound("Resource not found.");

        var isSaved = await _dbContext.SavedResources
            .AsNoTracking()
            .AnyAsync(savedResource => savedResource.UserId == userId && savedResource.ResourceId == id);

        return Ok(new
        {
            IsSaved = isSaved,
            resource.SavesCount
        });
    }

    [Authorize]
    [HttpPost("api/resources/{id:guid}/save")]
    public async Task<IActionResult> Save(Guid id)
    {
        var userIdStr = User.FindFirstValue(ClaimTypes.NameIdentifier);
        if (!Guid.TryParse(userIdStr, out var userId))
            return Unauthorized();

        var resource = await _dbContext.Resources.FirstOrDefaultAsync(r => r.Id == id);
        if (resource == null)
            return NotFound("Resource not found.");

        var existingSave = await _dbContext.SavedResources.FindAsync(userId, id);
        if (existingSave != null)
        {
            return Ok(new
            {
                IsSaved = true,
                resource.SavesCount
            });
        }

        _dbContext.SavedResources.Add(new SavedResource
        {
            UserId = userId,
            ResourceId = id,
            CreatedAtUtc = DateTime.UtcNow
        });

        resource.SavesCount += 1;
        await _dbContext.SaveChangesAsync();

        await _cache.InvalidateAsync($"resource:v4:{id}");

        return Ok(new
        {
            IsSaved = true,
            resource.SavesCount
        });
    }

    [Authorize]
    [HttpDelete("api/resources/{id:guid}/save")]
    public async Task<IActionResult> Unsave(Guid id)
    {
        var userIdStr = User.FindFirstValue(ClaimTypes.NameIdentifier);
        if (!Guid.TryParse(userIdStr, out var userId))
            return Unauthorized();

        var resource = await _dbContext.Resources.FirstOrDefaultAsync(r => r.Id == id);
        if (resource == null)
            return NotFound("Resource not found.");

        var existingSave = await _dbContext.SavedResources.FindAsync(userId, id);
        if (existingSave == null)
        {
            return Ok(new
            {
                IsSaved = false,
                resource.SavesCount
            });
        }

        _dbContext.SavedResources.Remove(existingSave);
        resource.SavesCount = Math.Max(resource.SavesCount - 1, 0);
        await _dbContext.SaveChangesAsync();

        await _cache.InvalidateAsync($"resource:v4:{id}");

        return Ok(new
        {
            IsSaved = false,
            resource.SavesCount
        });
    }

    [Authorize]
    [HttpPost("api/resources/{resourceId:guid}/images")]
    public async Task<IActionResult> UploadResourceImage(Guid resourceId, IFormFile file)
    {
        var resourceExists = await _dbContext.Resources
            .AnyAsync(r => r.Id == resourceId);

        if (!resourceExists) return NotFound();

        if (file == null || file.Length == 0)
            return BadRequest("No file provided");

        if (file.Length > 5_000_000)
            return BadRequest("File too large");

        if (!_imageService.IsValidImage(file))
            return BadRequest("Invalid image type");

        var userIdStr = User.FindFirstValue(ClaimTypes.NameIdentifier);
        if (!Guid.TryParse(userIdStr, out var userId))
            return Unauthorized();

        var savedFileName = await _imageService.SaveImageAsync(file);

        var resourceImage = new ResourceImage
        {
            ResourceId = resourceId,
            FileName = savedFileName,
            OriginalFileName = file.FileName,
            ContentType = file.ContentType,
            UploadedByUserId = userId
        };

        _dbContext.ResourceImages.Add(resourceImage);
        await _dbContext.SaveChangesAsync();

        return Ok(new
        {
            resourceImage.Id,
            resourceImage.FileName,
            resourceImage.ContentType,
            resourceImage.ResourceId
        });
    }

    [HttpGet("api/resources/{resourceId:guid}/images")]
    public async Task<IActionResult> GetImages(Guid resourceId)
    {
        var baseUrl = $"{Request.Scheme}://{Request.Host}";

        var images = await _dbContext.ResourceImages
            .Where(i => i.ResourceId == resourceId && !i.IsDeleted)
            .Select(i => new
            {
                i.Id,
                i.ContentType,
                Url = $"{baseUrl}/uploads/{i.FileName}"
            })
            .ToListAsync();

        return Ok(images);
    }

    [Authorize]
    [HttpDelete("api/resources/images/{imageId:guid}")]
    public async Task<IActionResult> DeleteImage(Guid imageId)
    {
        var image = await _dbContext.ResourceImages.FindAsync(imageId);
        if (image == null || image.IsDeleted)
            return NotFound();

        var userIdStr = User.FindFirstValue(ClaimTypes.NameIdentifier);
        if (!Guid.TryParse(userIdStr, out var userId))
            return Unauthorized();

        var isAdmin = User.IsInRole("Admin");

        if (!isAdmin && image.UploadedByUserId != userId)
            return Forbid();

        // delete the physical file
        var filePath = Path.Combine("wwwroot/uploads", image.FileName);
        if (System.IO.File.Exists(filePath))
        {
            try
            {
                System.IO.File.Delete(filePath);
            }
            catch (Exception ex)
            {
                Console.WriteLine($"[ERROR] Failed to delete file {filePath} for Image {imageId} by User {userId}: {ex.Message}");
            }
        }

        image.IsDeleted = true;
        image.DeletedAtUtc = DateTime.UtcNow;
        image.DeletedByUserId = userId;

        await _dbContext.SaveChangesAsync();

        return NoContent();
    }

    private string? GetCurrentDisplayName()
    {
        if (User.Identity?.IsAuthenticated != true)
            return null;

        return User.FindFirstValue(ClaimTypes.Name)
            ?? User.FindFirstValue(JwtRegisteredClaimNames.Name);
    }

}
