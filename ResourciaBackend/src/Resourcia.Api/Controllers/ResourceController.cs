using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using NodaTime;
using Resourcia.Api.Models.Filters;
using Resourcia.Api.Models.Resources;
using Resourcia.Api.Services;
using Resourcia.Api.Utils;
using Resourcia.Data;
using Resourcia.Data.Entities;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Globalization;

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

        var requestedFilterValues = MergeRequestedFilterValues(req);

        // --- Normalize provided filter keys + values ---
        var filterKeys = requestedFilterValues.Keys
            .Select(k => k.Trim())
            .Where(k => k.Length > 0)
            .Distinct(StringComparer.OrdinalIgnoreCase)
            .ToList();

        // Load filter definitions for provided keys
        var defs = filterKeys.Count == 0
            ? new List<FilterDefinitions>()
            : await _dbContext.Set<FilterDefinitions>()
                .Where(d => filterKeys.Contains(d.Key) && d.IsActive)
                .ToListAsync(ct);

        var defByKey = defs.ToDictionary(d => d.Key, d => d, StringComparer.OrdinalIgnoreCase);

        // Unknown keys?
        var unknownKeys = filterKeys.Where(k => !defByKey.ContainsKey(k)).ToList();
        if (unknownKeys.Count > 0)
            return BadRequest(new { error = "Unknown or disabled filter keys.", keys = unknownKeys });

        var filterRequests = requestedFilterValues
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

        // Validate IsMulti constraints
        var multiViolations = filterRequests
            .Select(filterRequest => new { filterRequest.Def.Key, filterRequest.Def.IsMulti, Count = filterRequest.Values.Count })
            .Where(x => !x.IsMulti && x.Count > 1)
            .Select(x => x.Key)
            .ToList();

        if (multiViolations.Count > 0)
            return BadRequest(new { error = "Multiple values provided for a single-value filter.", keys = multiViolations });

        var invalidDirectFieldFilterKeys = filterRequests
            .Where(filterRequest =>
                filterRequest.Def.Kind != FilterKind.Facet &&
                !string.IsNullOrWhiteSpace(FilterResourceFieldResolver.Resolve(
                    filterRequest.Def.ResourceField,
                    filterRequest.Def.Key,
                    filterRequest.Def.Label)))
            .Select(filterRequest => filterRequest.Key)
            .ToList();

        if (invalidDirectFieldFilterKeys.Count > 0)
        {
            return BadRequest(new
            {
                error = "These filters map directly to resource fields and should be sent through the top-level resource payload.",
                keys = invalidDirectFieldFilterKeys
            });
        }

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

        // --- Resolve stored filter values ---
        var defIds = filterRequests.Select(x => x.Def.Id).Distinct().ToList();

        var allowedFacetValues = defIds.Count == 0
            ? new List<FacetValues>()
            : await _dbContext.Set<FacetValues>()
                .Where(fv => defIds.Contains(fv.FilterDefinitionsId) && fv.IsActive)
                .ToListAsync(ct);

        var storedFilterValues = new List<ResourceFilterValues>();

        foreach (var filterRequest in filterRequests)
        {
            var matchingFacetValues = allowedFacetValues
                .Where(facetValue =>
                    facetValue.FilterDefinitionsId == filterRequest.Def.Id &&
                    filterRequest.Values.Contains(facetValue.Value, StringComparer.OrdinalIgnoreCase))
                .ToList();

            storedFilterValues.AddRange(matchingFacetValues.Select(matchingFacetValue => new ResourceFilterValues
            {
                Resource = resource,
                FilterDefinitionsId = filterRequest.Def.Id,
                FacetValuesId = matchingFacetValue.Id
            }));

            var matchedFacetValueKeys = matchingFacetValues
                .Select(matchingFacetValue => matchingFacetValue.Value)
                .ToHashSet(StringComparer.OrdinalIgnoreCase);

            var remainingValues = filterRequest.Values
                .Where(value => !matchedFacetValueKeys.Contains(value))
                .ToList();

            if (remainingValues.Count == 0)
            {
                continue;
            }

            switch (filterRequest.Def.Kind)
            {
                case FilterKind.Facet:
                    return BadRequest(new { error = $"Invalid values for '{filterRequest.Key}'.", values = remainingValues });

                case FilterKind.Boolean:
                {
                    foreach (var value in remainingValues)
                    {
                        if (!bool.TryParse(value, out var booleanValue))
                        {
                            return BadRequest(new { error = $"Invalid boolean value for '{filterRequest.Key}'.", value });
                        }

                        storedFilterValues.Add(new ResourceFilterValues
                        {
                            Resource = resource,
                            FilterDefinitionsId = filterRequest.Def.Id,
                            BooleanValue = booleanValue
                        });
                    }

                    break;
                }

                case FilterKind.Range:
                {
                    foreach (var value in remainingValues)
                    {
                        if (!double.TryParse(value, NumberStyles.Float, CultureInfo.InvariantCulture, out var numberValue))
                        {
                            return BadRequest(new { error = $"Invalid numeric value for '{filterRequest.Key}'.", value });
                        }

                        storedFilterValues.Add(new ResourceFilterValues
                        {
                            Resource = resource,
                            FilterDefinitionsId = filterRequest.Def.Id,
                            NumberValue = numberValue
                        });
                    }

                    break;
                }

                case FilterKind.Text:
                {
                    storedFilterValues.AddRange(remainingValues.Select(value => new ResourceFilterValues
                    {
                        Resource = resource,
                        FilterDefinitionsId = filterRequest.Def.Id,
                        StringValue = value
                    }));
                    break;
                }
            }
        }

        // --- Transaction: insert resource + ratings + stored values ---
        await using var tx = await _dbContext.Database.BeginTransactionAsync(ct);

        _dbContext.Resources.Add(resource);
        _dbContext.ResourceRatings.Add(ratings);
        if (storedFilterValues.Count > 0)
            _dbContext.ResourceFilterValues.AddRange(storedFilterValues);

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

        await InvalidateSearchSchemaAsync();

        var responseFilterValues = filterRequests.ToDictionary(
            filterRequest => filterRequest.Key,
            filterRequest => storedFilterValues
                .Where(value => value.FilterDefinitionsId == filterRequest.Def.Id)
                .Select(value => SerializeStoredFilterValue(
                    filterRequest.Key,
                    allowedFacetValues.FirstOrDefault(facetValue => facetValue.Id == value.FacetValuesId),
                    value.StringValue,
                    value.NumberValue,
                    value.BooleanValue)?.Value)
                .Where(value => !string.IsNullOrWhiteSpace(value))
                .Cast<string>()
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
            filterValues = responseFilterValues,
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

    [HttpGet("api/resources/schema")]
    public async Task<IActionResult> Schema(CancellationToken ct)
    {
        var response = await _cache.GetOrSetAsync(
            "resource:schema:v1",
            async () =>
            {
                var filters = await _dbContext.Filters
                    .AsNoTracking()
                    .Where(filter => filter.IsActive)
                    .OrderBy(filter => filter.SortOrder)
                    .Select(filter => new SearchSchemaFilterModel
                    {
                        Key = filter.Key,
                        Label = filter.Label,
                        Kind = filter.Kind.ToString().ToLowerInvariant(),
                        IsMulti = filter.IsMulti,
                        ResourceField = filter.ResourceField,
                        Values = filter.FacetValues
                            .Where(value => value.IsActive)
                            .OrderBy(value => value.SortOrder)
                            .Select(value => new SearchSchemaFilterValueModel
                            {
                                Value = value.Value,
                                Label = value.Label
                            })
                            .ToList()
                    })
                    .ToListAsync(ct);

                foreach (var filter in filters)
                {
                    filter.ResourceField = FilterResourceFieldResolver.Resolve(filter.ResourceField, filter.Key, filter.Label);
                }

                return new SearchSchemaResponseModel
                {
                    Filters = filters
                };
            },
            TimeSpan.FromHours(1));

        return Ok(response);
    }

    [HttpGet("api/resources/{id:guid}")]
    public async Task<IActionResult> GetById(Guid id, CancellationToken ct)
    {
        var resource = await _cache.GetOrSetAsync(
            $"resource:v5:{id}",
            async () =>
            {
                var rawResource = await _dbContext.Set<Resource>()
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
                        FilterValues = r.ResourceFilterValues
                            .Select(resourceFilterValue => new
                            {
                                Key = resourceFilterValue.FilterDefinitions.Key,
                                FacetValue = resourceFilterValue.FacetValues != null ? resourceFilterValue.FacetValues.Value : null,
                                FacetLabel = resourceFilterValue.FacetValues != null ? resourceFilterValue.FacetValues.Label : null,
                                resourceFilterValue.StringValue,
                                resourceFilterValue.NumberValue,
                                resourceFilterValue.BooleanValue
                            })
                            .ToList(),
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
                            })
                            .ToList()
                    })
                    .AsNoTracking()
                    .FirstOrDefaultAsync(ct);

                if (rawResource == null)
                {
                    return null;
                }

                return new
                {
                    rawResource.Id,
                    rawResource.Title,
                    rawResource.Description,
                    rawResource.Url,
                    rawResource.IsFree,
                    rawResource.Year,
                    rawResource.Author,
                    rawResource.LearningStyle,
                    rawResource.SavesCount,
                    rawResource.CreatedBy,
                    rawResource.CreatedAtUtc,
                    rawResource.UpdatedAtUtc,
                    rawResource.Tags,
                    rawResource.Ratings,
                    Facets = rawResource.FilterValues
                        .Select(filterValue => SerializeStoredFilterValue(
                            filterValue.Key,
                            filterValue.FacetValue,
                            filterValue.FacetLabel,
                            filterValue.StringValue,
                            filterValue.NumberValue,
                            filterValue.BooleanValue))
                        .Where(filterValue => filterValue != null)
                        .Cast<SerializedResourceFilterValue>()
                        .ToList(),
                    rawResource.Reviews
                };
            },
            TimeSpan.FromMinutes(5));

        if (resource == null) return NotFound();

        return Ok(resource);
    }

    [HttpGet("api/resources/search")]
    public async Task<IActionResult> Search(CancellationToken ct)
    {
        var cacheKey = $"search:v5:{Request.QueryString}";

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

            // ----- SCHEMA-DRIVEN FILTERS -----
            var activeFilters = await _dbContext.Filters
                .AsNoTracking()
                .Where(filter => filter.IsActive)
                .Select(filter => new SearchableFilterDefinition(filter.Key, filter.Kind, filter.ResourceField))
                .ToListAsync(ct);

            foreach (var filter in activeFilters)
            {
                var resourceField = FilterResourceFieldResolver.Resolve(filter.ResourceField, filter.Key);

                switch (filter.Kind)
                {
                    case FilterKind.Facet:
                    {
                        if (!queryParams.TryGetValue(filter.Key, out var rawFacetValues))
                        {
                            continue;
                        }

                        var facetValues = ParseQueryValues(rawFacetValues);
                        if (facetValues.Count == 0)
                        {
                            continue;
                        }

                        dbQuery = dbQuery.Where(resource =>
                            resource.ResourceFilterValues.Any(resourceFilterValue =>
                                resourceFilterValue.FilterDefinitions.Key == filter.Key &&
                                resourceFilterValue.FacetValues != null &&
                                facetValues.Contains(resourceFilterValue.FacetValues.Value))
                        );
                        break;
                    }
                    case FilterKind.Range:
                    {
                        var minValue = queryParams[$"{filter.Key}Min"].ToString();
                        var maxValue = queryParams[$"{filter.Key}Max"].ToString();
                        dbQuery = string.IsNullOrWhiteSpace(resourceField)
                            ? await ApplyStoredRangeFilterAsync(dbQuery, filter.Key, minValue, maxValue, ct)
                            : ApplyRangeFilter(dbQuery, resourceField, minValue, maxValue);
                        break;
                    }
                    case FilterKind.Boolean:
                    {
                        if (!queryParams.TryGetValue(filter.Key, out var rawBooleanValue))
                        {
                            continue;
                        }

                        dbQuery = string.IsNullOrWhiteSpace(resourceField)
                            ? await ApplyStoredBooleanFilterAsync(dbQuery, filter.Key, rawBooleanValue.ToString(), ct)
                            : ApplyBooleanFilter(dbQuery, resourceField, rawBooleanValue.ToString());
                        break;
                    }
                    case FilterKind.Text:
                    {
                        if (!queryParams.TryGetValue(filter.Key, out var rawTextValue))
                        {
                            continue;
                        }

                        dbQuery = string.IsNullOrWhiteSpace(resourceField)
                            ? ApplyStoredTextFilter(dbQuery, filter.Key, rawTextValue.ToString())
                            : ApplyTextFilter(dbQuery, resourceField, rawTextValue.ToString());
                        break;
                    }
                }
            }

            var totalItems = await dbQuery.CountAsync(ct);
            var totalPages = totalItems == 0 ? 0 : (int)Math.Ceiling(totalItems / (double)pageSize);

            if (totalPages > 0 && page > totalPages)
                page = totalPages;

            var rawItems = await dbQuery
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
                    FilterValues = r.ResourceFilterValues
                        .Select(resourceFilterValue => new
                        {
                            Key = resourceFilterValue.FilterDefinitions.Key,
                            FacetValue = resourceFilterValue.FacetValues != null ? resourceFilterValue.FacetValues.Value : null,
                            FacetLabel = resourceFilterValue.FacetValues != null ? resourceFilterValue.FacetValues.Label : null,
                            resourceFilterValue.StringValue,
                            resourceFilterValue.NumberValue,
                            resourceFilterValue.BooleanValue
                        }).ToList()
                })
                .ToListAsync(ct);

            var items = rawItems
                .Select(item => new
                {
                    item.Id,
                    item.Title,
                    item.Description,
                    item.Url,
                    item.IsFree,
                    item.Year,
                    item.Author,
                    item.LearningStyle,
                    item.Tags,
                    item.CreatedBy,
                    item.CreatedAtUtc,
                    item.Ratings,
                    Facets = item.FilterValues
                        .Select(filterValue => SerializeStoredFilterValue(
                            filterValue.Key,
                            filterValue.FacetValue,
                            filterValue.FacetLabel,
                            filterValue.StringValue,
                            filterValue.NumberValue,
                            filterValue.BooleanValue))
                        .Where(filterValue => filterValue != null)
                        .Cast<SerializedResourceFilterValue>()
                        .ToList()
                })
                .ToList();

            return new { items, page, pageSize, totalItems, totalPages };

        }, TimeSpan.FromMinutes(2));

        return Ok(result);
    }

    [HttpGet("api/resources/lookup")]
    public async Task<IActionResult> Lookup([FromQuery] string[] domains, CancellationToken ct)
    {
        var requestedDomains = domains
            .SelectMany(domain => domain.Split(',', StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries))
            .Where(domain => !string.IsNullOrWhiteSpace(domain))
            .Select(domain => NormalizeDomain(domain))
            .Where(domain => !string.IsNullOrWhiteSpace(domain))
            .Distinct(StringComparer.OrdinalIgnoreCase)
            .ToList();

        if (requestedDomains.Count == 0)
        {
            return Ok(new ResourceLookupResponseModel());
        }

        var rawResources = await _dbContext.Resources
            .AsNoTracking()
            .Select(resource => new
            {
                resource.Id,
                resource.Title,
                resource.Description,
                resource.Url,
                resource.IsFree,
                resource.LearningStyle,
                resource.SavesCount,
                resource.CreatedAtUtc,
                Ratings = resource.Ratings == null ? null : new ResourceLookupRatingsModel
                {
                    AverageRating = resource.Ratings.AverageRating,
                    TotalCount = resource.Ratings.TotalCount
                },
                FilterValues = resource.ResourceFilterValues
                    .Select(resourceFilterValue => new
                    {
                        Key = resourceFilterValue.FilterDefinitions.Key,
                        FacetValue = resourceFilterValue.FacetValues != null ? resourceFilterValue.FacetValues.Value : null,
                        FacetLabel = resourceFilterValue.FacetValues != null ? resourceFilterValue.FacetValues.Label : null,
                        resourceFilterValue.StringValue,
                        resourceFilterValue.NumberValue,
                        resourceFilterValue.BooleanValue
                    })
                    .ToList()
            })
            .ToListAsync(ct);

        var resources = rawResources
            .Select(resource => new
            {
                resource.Id,
                resource.Title,
                resource.Description,
                resource.Url,
                resource.IsFree,
                resource.LearningStyle,
                resource.SavesCount,
                resource.CreatedAtUtc,
                resource.Ratings,
                Facets = resource.FilterValues
                    .Select(filterValue => SerializeStoredFilterValue(
                        filterValue.Key,
                        filterValue.FacetValue,
                        filterValue.FacetLabel,
                        filterValue.StringValue,
                        filterValue.NumberValue,
                        filterValue.BooleanValue))
                    .Where(filterValue => filterValue != null)
                    .Select(filterValue => new ResourceLookupFacetModel
                    {
                        Key = filterValue!.Key,
                        Value = filterValue.Value,
                        Label = filterValue.Label
                    })
                    .ToList()
            })
            .ToList();

        var items = resources
            .Select(resource => new
            {
                Domain = NormalizeDomain(resource.Url),
                Resource = resource
            })
            .Where(item => item.Domain != null && requestedDomains.Contains(item.Domain, StringComparer.OrdinalIgnoreCase))
            .GroupBy(item => item.Domain!, StringComparer.OrdinalIgnoreCase)
            .Select(group =>
            {
                var bestMatch = group
                    .OrderByDescending(item => item.Resource.Ratings?.TotalCount ?? 0)
                    .ThenByDescending(item => item.Resource.Ratings?.AverageRating ?? 0)
                    .ThenByDescending(item => item.Resource.SavesCount)
                    .ThenByDescending(item => item.Resource.CreatedAtUtc)
                    .First();

                return new ResourceLookupItemModel
                {
                    Domain = group.Key,
                    ResourceCount = group.Count(),
                    Id = bestMatch.Resource.Id,
                    Title = bestMatch.Resource.Title,
                    Description = bestMatch.Resource.Description,
                    Url = bestMatch.Resource.Url,
                    IsFree = bestMatch.Resource.IsFree,
                    LearningStyle = bestMatch.Resource.LearningStyle,
                    Ratings = bestMatch.Resource.Ratings,
                    Facets = bestMatch.Resource.Facets
                };
            })
            .ToList();

        return Ok(new ResourceLookupResponseModel
        {
            Items = items
        });
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

        await _cache.InvalidateAsync($"resource:v5:{id}");

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

        await _cache.InvalidateAsync($"resource:v5:{id}");

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

    private static string? NormalizeDomain(string? value)
    {
        if (string.IsNullOrWhiteSpace(value))
        {
            return null;
        }

        var normalizedValue = value.Trim();
        if (!normalizedValue.StartsWith("http://", StringComparison.OrdinalIgnoreCase) &&
            !normalizedValue.StartsWith("https://", StringComparison.OrdinalIgnoreCase))
        {
            normalizedValue = $"https://{normalizedValue}";
        }

        if (!Uri.TryCreate(normalizedValue, UriKind.Absolute, out var uri))
        {
            return null;
        }

        var host = uri.Host.Trim().ToLowerInvariant();
        return host.StartsWith("www.", StringComparison.OrdinalIgnoreCase) ? host[4..] : host;
    }

    private static List<string> ParseQueryValues(IEnumerable<string> rawValues)
    {
        return rawValues
            .SelectMany(value => value.Split(',', StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries))
            .Where(value => !string.IsNullOrWhiteSpace(value))
            .Distinct(StringComparer.OrdinalIgnoreCase)
            .ToList();
    }

    private static Dictionary<string, List<string>> MergeRequestedFilterValues(CreateResourceModel request)
    {
        var merged = new Dictionary<string, List<string>>(StringComparer.OrdinalIgnoreCase);

        foreach (var source in new[] { request.Facets, request.FilterValues })
        {
            foreach (var (key, values) in source)
            {
                if (!merged.TryGetValue(key, out var existingValues))
                {
                    existingValues = new List<string>();
                    merged[key] = existingValues;
                }

                existingValues.AddRange(values ?? []);
            }
        }

        return merged;
    }

    private async Task InvalidateSearchSchemaAsync()
    {
        await _cache.InvalidateAsync("search:schema");
        await _cache.InvalidateAsync("search:schema:v2");
        await _cache.InvalidateAsync("search:schema:v3");
        await _cache.InvalidateAsync("search:schema:v4");
        await _cache.InvalidateAsync("search:schema:v5");
    }

    private static SerializedResourceFilterValue? SerializeStoredFilterValue(
        string key,
        FacetValues? matchingFacetValue,
        string? stringValue,
        double? numberValue,
        bool? booleanValue)
    {
        return SerializeStoredFilterValue(
            key,
            matchingFacetValue?.Value,
            matchingFacetValue?.Label,
            stringValue,
            numberValue,
            booleanValue);
    }

    private static SerializedResourceFilterValue? SerializeStoredFilterValue(
        string key,
        string? facetValue,
        string? facetLabel,
        string? stringValue,
        double? numberValue,
        bool? booleanValue)
    {
        if (!string.IsNullOrWhiteSpace(facetValue))
        {
            return new SerializedResourceFilterValue
            {
                Key = key,
                Value = facetValue!,
                Label = string.IsNullOrWhiteSpace(facetLabel) ? facetValue! : facetLabel!
            };
        }

        if (booleanValue.HasValue)
        {
            return new SerializedResourceFilterValue
            {
                Key = key,
                Value = booleanValue.Value ? "true" : "false",
                Label = booleanValue.Value ? "Yes" : "No"
            };
        }

        if (numberValue.HasValue)
        {
            var serializedNumber = numberValue.Value.ToString("0.################", CultureInfo.InvariantCulture);
            return new SerializedResourceFilterValue
            {
                Key = key,
                Value = serializedNumber,
                Label = serializedNumber
            };
        }

        if (!string.IsNullOrWhiteSpace(stringValue))
        {
            return new SerializedResourceFilterValue
            {
                Key = key,
                Value = stringValue!,
                Label = stringValue!
            };
        }

        return null;
    }

    private async Task<IQueryable<Resource>> ApplyStoredRangeFilterAsync(
        IQueryable<Resource> query,
        string filterKey,
        string? minValue,
        string? maxValue,
        CancellationToken ct)
    {
        var hasMin = double.TryParse(minValue, NumberStyles.Float, CultureInfo.InvariantCulture, out var minNumber);
        var hasMax = double.TryParse(maxValue, NumberStyles.Float, CultureInfo.InvariantCulture, out var maxNumber);

        if (!hasMin && !hasMax)
        {
            return query;
        }

        var matchingFacetValueIds = await _dbContext.Set<FacetValues>()
            .AsNoTracking()
            .Where(facetValue => facetValue.IsActive && facetValue.FilterDefinitions.Key == filterKey)
            .Select(facetValue => new
            {
                facetValue.Id,
                facetValue.Label,
                facetValue.Value
            })
            .ToListAsync(ct);

        var allowedIds = matchingFacetValueIds
            .Where(facetValue =>
            {
                var numericValue = TryParseFacetNumericValue(facetValue.Label, facetValue.Value);
                if (!numericValue.HasValue)
                {
                    return false;
                }

                if (hasMin && numericValue.Value < minNumber)
                {
                    return false;
                }

                if (hasMax && numericValue.Value > maxNumber)
                {
                    return false;
                }

                return true;
            })
            .Select(facetValue => facetValue.Id)
            .ToList();

        return query.Where(resource =>
            resource.ResourceFilterValues.Any(resourceFilterValue =>
                resourceFilterValue.FilterDefinitions.Key == filterKey &&
                (
                    (resourceFilterValue.NumberValue.HasValue &&
                     (!hasMin || resourceFilterValue.NumberValue.Value >= minNumber) &&
                     (!hasMax || resourceFilterValue.NumberValue.Value <= maxNumber))
                    || (resourceFilterValue.FacetValuesId.HasValue && allowedIds.Contains(resourceFilterValue.FacetValuesId.Value))
                )));
    }

    private async Task<IQueryable<Resource>> ApplyStoredBooleanFilterAsync(
        IQueryable<Resource> query,
        string filterKey,
        string? rawValue,
        CancellationToken ct)
    {
        if (!bool.TryParse(rawValue, out var booleanValue))
        {
            return query;
        }

        var matchingFacetValueIds = await _dbContext.Set<FacetValues>()
            .AsNoTracking()
            .Where(facetValue => facetValue.IsActive && facetValue.FilterDefinitions.Key == filterKey)
            .Select(facetValue => new
            {
                facetValue.Id,
                facetValue.Label,
                facetValue.Value
            })
            .ToListAsync(ct);

        var allowedIds = matchingFacetValueIds
            .Where(facetValue => TryParseFacetBooleanValue(facetValue.Label, facetValue.Value) == booleanValue)
            .Select(facetValue => facetValue.Id)
            .ToList();

        return query.Where(resource =>
            resource.ResourceFilterValues.Any(resourceFilterValue =>
                resourceFilterValue.FilterDefinitions.Key == filterKey &&
                (
                    (resourceFilterValue.BooleanValue.HasValue && resourceFilterValue.BooleanValue.Value == booleanValue)
                    || (resourceFilterValue.FacetValuesId.HasValue && allowedIds.Contains(resourceFilterValue.FacetValuesId.Value))
                )));
    }

    private static IQueryable<Resource> ApplyStoredTextFilter(
        IQueryable<Resource> query,
        string filterKey,
        string? rawValue)
    {
        var textValue = rawValue?.Trim().ToLowerInvariant();
        if (string.IsNullOrWhiteSpace(textValue))
        {
            return query;
        }

        return query.Where(resource =>
            resource.ResourceFilterValues.Any(resourceFilterValue =>
                resourceFilterValue.FilterDefinitions.Key == filterKey &&
                (
                    (resourceFilterValue.StringValue != null && resourceFilterValue.StringValue.ToLower().Contains(textValue))
                    || (resourceFilterValue.FacetValues != null &&
                        (resourceFilterValue.FacetValues.Label.ToLower().Contains(textValue)
                         || resourceFilterValue.FacetValues.Value.ToLower().Contains(textValue)))
                )));
    }

    private static double? TryParseFacetNumericValue(string label, string value)
    {
        if (double.TryParse(label, NumberStyles.Float, CultureInfo.InvariantCulture, out var labelNumber))
        {
            return labelNumber;
        }

        if (double.TryParse(value, NumberStyles.Float, CultureInfo.InvariantCulture, out var valueNumber))
        {
            return valueNumber;
        }

        return null;
    }

    private static bool? TryParseFacetBooleanValue(string label, string value)
    {
        if (bool.TryParse(value, out var valueBoolean))
        {
            return valueBoolean;
        }

        if (bool.TryParse(label, out var labelBoolean))
        {
            return labelBoolean;
        }

        return value.Trim().ToLowerInvariant() switch
        {
            "yes" or "y" or "1" => true,
            "no" or "n" or "0" => false,
            _ => label.Trim().ToLowerInvariant() switch
            {
                "yes" or "y" or "1" => true,
                "no" or "n" or "0" => false,
                _ => null
            }
        };
    }

    private static IQueryable<Resource> ApplyRangeFilter(
        IQueryable<Resource> query,
        string? resourceField,
        string? minValue,
        string? maxValue)
    {
        if (string.IsNullOrWhiteSpace(resourceField))
        {
            return query;
        }

        switch (resourceField.Trim().ToLowerInvariant())
        {
            case "year":
            {
                if (int.TryParse(minValue, NumberStyles.Integer, CultureInfo.InvariantCulture, out var minYear))
                {
                    query = query.Where(resource => resource.Year.HasValue && resource.Year.Value >= minYear);
                }

                if (int.TryParse(maxValue, NumberStyles.Integer, CultureInfo.InvariantCulture, out var maxYear))
                {
                    query = query.Where(resource => resource.Year.HasValue && resource.Year.Value <= maxYear);
                }

                return query;
            }
            case "rating":
            {
                if (float.TryParse(minValue, NumberStyles.Float, CultureInfo.InvariantCulture, out var minRating))
                {
                    query = query.Where(resource =>
                        resource.Ratings != null &&
                        resource.Ratings.TotalCount > 0 &&
                        resource.Ratings.AverageRating >= minRating);
                }

                if (float.TryParse(maxValue, NumberStyles.Float, CultureInfo.InvariantCulture, out var maxRating))
                {
                    query = query.Where(resource =>
                        resource.Ratings != null &&
                        resource.Ratings.TotalCount > 0 &&
                        resource.Ratings.AverageRating <= maxRating);
                }

                return query;
            }
            case "savescount":
            {
                if (int.TryParse(minValue, NumberStyles.Integer, CultureInfo.InvariantCulture, out var minSaves))
                {
                    query = query.Where(resource => resource.SavesCount >= minSaves);
                }

                if (int.TryParse(maxValue, NumberStyles.Integer, CultureInfo.InvariantCulture, out var maxSaves))
                {
                    query = query.Where(resource => resource.SavesCount <= maxSaves);
                }

                return query;
            }
            default:
                return query;
        }
    }

    private static IQueryable<Resource> ApplyBooleanFilter(
        IQueryable<Resource> query,
        string? resourceField,
        string? rawValue)
    {
        if (string.IsNullOrWhiteSpace(resourceField) || !bool.TryParse(rawValue, out var booleanValue))
        {
            return query;
        }

        return resourceField.Trim().ToLowerInvariant() switch
        {
            "isfree" => query.Where(resource => resource.IsFree == booleanValue),
            _ => query
        };
    }

    private static IQueryable<Resource> ApplyTextFilter(
        IQueryable<Resource> query,
        string? resourceField,
        string? rawValue)
    {
        if (string.IsNullOrWhiteSpace(resourceField))
        {
            return query;
        }

        var textValue = rawValue?.Trim().ToLowerInvariant();
        if (string.IsNullOrWhiteSpace(textValue))
        {
            return query;
        }

        return resourceField.Trim().ToLowerInvariant() switch
        {
            "author" => query.Where(resource => resource.Author != null && resource.Author.ToLower().Contains(textValue)),
            "createdby" => query.Where(resource => resource.CreatedBy != null && resource.CreatedBy.ToLower().Contains(textValue)),
            "description" => query.Where(resource => resource.Description != null && resource.Description.ToLower().Contains(textValue)),
            "learningstyle" => query.Where(resource => resource.LearningStyle.ToLower().Contains(textValue)),
            "title" => query.Where(resource => resource.Title.ToLower().Contains(textValue)),
            "url" => query.Where(resource => resource.Url.ToLower().Contains(textValue)),
            "tags" => query.Where(resource => resource.Tags.Any(tag => tag.ToLower().Contains(textValue))),
            _ => query
        };
    }

    private sealed record SearchableFilterDefinition(
        string Key,
        FilterKind Kind,
        string? ResourceField);

    private sealed class SerializedResourceFilterValue
    {
        public string Key { get; init; } = string.Empty;
        public string Value { get; init; } = string.Empty;
        public string Label { get; init; } = string.Empty;
    }

}
