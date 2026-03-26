using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using NodaTime;
using Resourcia.Api.Models.Resources;
using Resourcia.Data;
using Resourcia.Data.Entities;
using System.Security.Claims;

namespace Resourcia.Api.Controllers;

[Route("api/[controller]")]
[ApiController]
public class ResourceController(AppDbContext dbContext) : ControllerBase
{
    private AppDbContext _dbContext = dbContext;

    [HttpPost]
    public async Task<IActionResult> Create([FromBody] CreateResourceModel req, CancellationToken ct)
    {
        // Basic validation
        if (string.IsNullOrWhiteSpace(req.Title))
            return BadRequest(new { error = "Title is required." });

        if (string.IsNullOrWhiteSpace(req.Url))
            return BadRequest(new { error = "Url is required." });

        // Normalize facet keys + values
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

        // Create resource entity
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
            Rating = req.Rating,
            CreatedAtUtc = DateTime.UtcNow,
            UpdatedAtUtc = DateTime.UtcNow
        };

        // Resolve FacetValues for all requested facet assignments
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

        // Pull all facet values for these defs once, then match in memory
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

            // Missing slugs?
            var found = matches.Select(m => m.Value).ToHashSet(StringComparer.OrdinalIgnoreCase);
            var missing = fr.Values.Where(v => !found.Contains(v)).ToList();
            if (missing.Count > 0)
                return BadRequest(new { error = $"Invalid facet values for '{fr.Key}'.", values = missing });

            joins.AddRange(matches.Select(m => new ResourceFacetValues
            {
                ResourceId = resource.Id,
                FacetValuesId = m.Id
            }));
        }

        // Transaction: insert resource + join rows
        await using var tx = await _dbContext.Database.BeginTransactionAsync(ct);

        _dbContext.Set<Resource>().Add(resource);
        if (joins.Count > 0)
            _dbContext.Set<ResourceFacetValues>().AddRange(joins);

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

        // Response: return resource + chosen facet slugs per key
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
            resource.Tags,
            resource.Rating,
            facets = responseFacets
        });
    }

    [HttpGet("{id:guid}")]
    public async Task<IActionResult> GetById(Guid id, CancellationToken ct)
    {
        var resource = await _dbContext.Set<Resource>()
            .AsNoTracking()
            .FirstOrDefaultAsync(r => r.Id == id, ct);

        if (resource is null) return NotFound();

        return Ok(resource);
    }

<<<<<<< HEAD
    [HttpGet("search")]
=======
    [HttpGet("/search")] 
>>>>>>> 9c2cef82cc7c9f538a77c944e04c4cb51252b045
    public async Task<IActionResult> Search(CancellationToken ct)
    {
        var queryParams = Request.Query;

        var dbQuery = _dbContext.Set<Resource>()
<<<<<<< HEAD
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
            pageSize = Math.Min(parsedPageSize, 100); // optional safety limit
        }
=======
        .AsNoTracking()
        .AsQueryable();
>>>>>>> 9c2cef82cc7c9f538a77c944e04c4cb51252b045

        // ----- TEXT SEARCH -----
        if (queryParams.TryGetValue("q", out var qValue))
        {
            var lowerTrimmed = qValue.ToString().Trim().ToLower();

<<<<<<< HEAD
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
=======
            dbQuery = dbQuery.Where(r =>
                 r.Title.ToLower().Contains(lowerTrimmed) ||
                 (r.Description != null && r.Description.ToLower().Contains(lowerTrimmed))
             );
        }

        // ----- DYNAMIC FACETS -----
        var reservedKeys = new HashSet<string>
>>>>>>> 9c2cef82cc7c9f538a77c944e04c4cb51252b045
        {
            "q", "page", "pageSize"
        };

        var facetFilters = queryParams
            .Where(p => !reservedKeys.Contains(p.Key))
            .ToDictionary(
                p => p.Key,
                p => p.Value.ToList()
            );

<<<<<<< HEAD
        foreach (var filter in facetFilters)
        {
            var key = filter.Key;
            var values = filter.Value
                .Where(v => !string.IsNullOrWhiteSpace(v))
                .Select(v => v.Trim())
                .Distinct(StringComparer.OrdinalIgnoreCase)
                .ToList();

            if (values.Count == 0)
                continue;

            dbQuery = dbQuery.Where(r =>
                r.ResourceFacetValues.Any(rfv =>
                    rfv.FacetValues.FilterDefinitions.Key == key &&
                    values.Contains(rfv.FacetValues.Value)
                )
            );
        }

        // total AFTER filters, BEFORE paging
        var totalItems = await dbQuery.CountAsync(ct);

        var totalPages = totalItems == 0
            ? 0
            : (int)Math.Ceiling(totalItems / (double)pageSize);

        // optional: clamp page if user requests too large a page
        if (totalPages > 0 && page > totalPages)
        {
            page = totalPages;
        }

        var items = await dbQuery
            .OrderByDescending(r => r.CreatedAtUtc) // choose any stable ordering
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .ToListAsync(ct);

        return Ok(new
        {
            items,
            page,
            pageSize,
            totalItems,
            totalPages
        });
=======
        // facetFilters now contains:
        // { "subject": ["math"], "difficulty": ["highschool"] }

        // (we'll apply filtering here later)

        var results = await dbQuery.Take(20).ToListAsync(ct);

        return Ok(results);

>>>>>>> 9c2cef82cc7c9f538a77c944e04c4cb51252b045
    }

    [HttpGet("{id:guid}/reviews")]

    public async Task<IActionResult> GetReviews(Guid id, int page = 1, int pageSize = 10, string sortBy = "helpful")
    {
        var query = _dbContext.ResourceReviews
            .Where(r => r.ResourceId == id);

        query = sortBy switch
        {
            "helpful" => query.OrderByDescending(r => r.Votes.Count(v => v.IsHelpful)),
            "newest" => query.OrderByDescending(r => r.CreatedAt),
            "rating" => query.OrderByDescending(r => r.Rating),
            _ => query.OrderByDescending(r => r.CreatedAt)
        };

        var reviews = await query
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .Select(r => new ReviewModel
            {
                Id = r.Id,
                Content = r.Content,
                Rating = r.Rating,
                CreatedAt = r.CreatedAt,
                Upvotes = r.Votes.Count(v => v.IsHelpful),
                Downvotes = r.Votes.Count(v => !v.IsHelpful)
            })
            .ToListAsync();

        return Ok(reviews);
    }

    [Authorize]
    [HttpPost("{id:guid}/reviews")]
    public async Task<IActionResult> PostReview(Guid id, CreateReviewModel reviewRequest)
    {
        if (reviewRequest.Rating < 1 || reviewRequest.Rating > 5)
        {
            return BadRequest("Ratings must be between 1 and 5 (inclusive).");
        }

        if (id == Guid.Empty)
        {
            return BadRequest("Invalid resource id.");
        }

        var resource = await _dbContext.Resources
            .AsNoTracking()
            .FirstOrDefaultAsync(r => r.Id == id);

        if (resource == null)
        {
            return NotFound("Resource not found.");
        }

        var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);

        if (userId == null)
        {
            return Unauthorized();
        }

        var alreadyReviewed = await _dbContext.ResourceReviews
            .AnyAsync(r => r.ResourceId == id && r.UserId == Guid.Parse(userId));

        if (alreadyReviewed)
        {
            return Conflict("You have already reviewed this resource.");
        }
        var review = new ResourceReview
        {
            Id = Guid.NewGuid(),
            ResourceId = id,
            UserId = Guid.Parse(userId),
            Rating = reviewRequest.Rating,
            Content = reviewRequest.Content?.Trim(),
            CreatedAt = SystemClock.Instance.GetCurrentInstant()
        };

        _dbContext.ResourceReviews.Add(review);
        await _dbContext.SaveChangesAsync();
        await UpdateResourceRatingsAsync(id);
        return Ok(review);
    }

    [Authorize]
    [HttpPost("reviews/{reviewId:guid}/vote")]
    public async Task<IActionResult> VoteReview(Guid reviewId, bool isUpvote)
    {
        var userIdStr = User.FindFirstValue(ClaimTypes.NameIdentifier);
        if (userIdStr == null) return Unauthorized();

        if (!Guid.TryParse(userIdStr, out var userId))
            return Unauthorized("Invalid user id.");

        var review = await _dbContext.ResourceReviews
            .Include(r => r.Votes)
            .FirstOrDefaultAsync(r => r.Id == reviewId);

        if (review == null)
            return NotFound("Review not found.");

        var existingVote = await _dbContext.ReviewsVotes.FirstOrDefaultAsync(v => v.UserId == userId && v.ReviewId == reviewId);
        if (existingVote != null)
        {
            if (existingVote.IsHelpful == isUpvote)
            {
                _dbContext.ReviewsVotes.Remove(existingVote);
            }
            else
            {
                existingVote.IsHelpful = isUpvote;
            }
        }
        else
        {
            var vote = new ReviewVotes
            {
                Id = Guid.NewGuid(),
                ReviewId = reviewId,
                UserId = userId,
                IsHelpful = isUpvote,
                
            };
            _dbContext.ReviewsVotes.Add(vote);
        }

        await _dbContext.SaveChangesAsync();

        var upvotes = await _dbContext.ReviewsVotes
            .CountAsync(v => v.ReviewId == reviewId && v.IsHelpful);

        var downvotes = await _dbContext.ReviewsVotes
            .CountAsync(v => v.ReviewId == reviewId && !v.IsHelpful);

        return Ok(new { reviewId, upvotes, downvotes });
    }

    [Authorize]
    [HttpDelete("{id:guid}/reviews")]
    public async Task<IActionResult> DeleteReview(Guid id)
    {
        // get current user
        var userIdStr = User.FindFirstValue(ClaimTypes.NameIdentifier);
        if (userIdStr == null) return Unauthorized();

        if (!Guid.TryParse(userIdStr, out var userId))
            return Unauthorized("Invalid user id.");

        // find review by resourceId + userId
        var review = await _dbContext.ResourceReviews
            .FirstOrDefaultAsync(r => r.ResourceId == id && r.UserId == userId);

        if (review == null)
            return NotFound("Review not found or you are not the author.");

        // remove review + optionally its votes
        var votes = _dbContext.ReviewsVotes.Where(v => v.ReviewId == review.Id);
        _dbContext.ReviewsVotes.RemoveRange(votes);
        _dbContext.ResourceReviews.Remove(review);


        await _dbContext.SaveChangesAsync();
        await UpdateResourceRatingsAsync(id);
        return NoContent();
    }

    [Authorize]
    [HttpDelete("reviews/{reviewId:guid}/vote")]
    public async Task<IActionResult> DeleteVote(Guid reviewId)
    {
        var userIdStr = User.FindFirstValue(ClaimTypes.NameIdentifier);
        if (userIdStr == null) return Unauthorized();

        if (!Guid.TryParse(userIdStr, out var userId))
            return Unauthorized("Invalid user id.");

        // find vote by reviewId + userId
        var vote = await _dbContext.ReviewsVotes
            .FirstOrDefaultAsync(v => v.ReviewId == reviewId && v.UserId == userId);

        if (vote == null)
            return NotFound("Vote not found.");

        _dbContext.ReviewsVotes.Remove(vote);
        await _dbContext.SaveChangesAsync();

        return NoContent();
    }

    [HttpGet("{id:guid}/rating")]
    public async Task<IActionResult> GetRating(Guid id)
    {
        var rating = await _dbContext.ResourceRatings
            .FirstOrDefaultAsync(r => r.ResourceId == id);

        if (rating == null)
            return Ok(new { average = 0, total = 0 });

        return Ok(rating);
    }

    [HttpGet("{id:guid}/threads")]
    public async Task<IActionResult> GetThreads(Guid id)
    {
        var threads = await _dbContext.Set<Discussions>()
            .Where(t => t.ResourceId == id)
            .OrderByDescending(t => t.CreatedAt)
            .Select(t => new
            {
                t.Id,
                t.Content,
                t.UserId,
                t.CreatedAt,

                Replies = t.Replies
                    .OrderBy(r => r.CreatedAt)
                    .Select(r => new
                    {
                        r.Id,
                        r.Content,
                        r.UserId,
                        r.CreatedAt
                    })
                    .ToList()
            })
            .ToListAsync();

        return Ok(threads);
    }

    [Authorize]
    [HttpPost("{id:guid}/threads")]
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

        return Ok(new
        {
            reply.Id,
            reply.Content,
            reply.UserId,
            reply.CreatedAt
        });
    }

    private async Task UpdateResourceRatingsAsync(Guid resourceId)
    {
        var ratings = await _dbContext.ResourceReviews
        .Where(r => r.ResourceId == resourceId)
        .GroupBy(r => r.ResourceId)
        .Select(g => new
        {
            Count = g.Count(),
            Avg = g.Average(x => x.Rating),
            Count1 = g.Count(x => x.Rating == 1),
            Count2 = g.Count(x => x.Rating == 2),
            Count3 = g.Count(x => x.Rating == 3),
            Count4 = g.Count(x => x.Rating == 4),
            Count5 = g.Count(x => x.Rating == 5),
        })
        .FirstOrDefaultAsync();

        var entity = await _dbContext.ResourceRatings
            .FirstOrDefaultAsync(r => r.ResourceId == resourceId);

        if (ratings == null)
        {
            if (entity != null)
                _dbContext.ResourceRatings.Remove(entity);

            return;
        }

        if (entity == null)
        {
            entity = new ResourceRatings
            {
                ResourceId = resourceId
            };
            _dbContext.ResourceRatings.Add(entity);
        }

        entity.TotalCount = ratings.Count;
        entity.AverageRating = (float)ratings.Avg;
        entity.Count1 = ratings.Count1;
        entity.Count2 = ratings.Count2;
        entity.Count3 = ratings.Count3;
        entity.Count4 = ratings.Count4;
        entity.Count5 = ratings.Count5;

        await _dbContext.SaveChangesAsync();
    }


}
