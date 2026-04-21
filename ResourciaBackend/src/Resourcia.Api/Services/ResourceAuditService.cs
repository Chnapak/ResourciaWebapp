using System.Globalization;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text.Json;
using System.Text.Json.Serialization;
using Microsoft.EntityFrameworkCore;
using Resourcia.Api.Models.Audit;
using Resourcia.Data;
using Resourcia.Data.Entities;

namespace Resourcia.Api.Services;

public class ResourceAuditService
{
    private static readonly JsonSerializerOptions JsonOptions = new()
    {
        PropertyNamingPolicy = JsonNamingPolicy.CamelCase,
        DefaultIgnoreCondition = JsonIgnoreCondition.WhenWritingNull
    };

    private readonly AppDbContext _dbContext;
    private readonly ILogger<ResourceAuditService> _logger;

    public ResourceAuditService(AppDbContext dbContext, ILogger<ResourceAuditService> logger)
    {
        _dbContext = dbContext;
        _logger = logger;
    }

    public async Task<ResourceAuditSnapshot?> BuildSnapshotAsync(Guid resourceId, CancellationToken ct)
    {
        var snapshot = await _dbContext.Resources
            .IgnoreQueryFilters()
            .AsNoTracking()
            .Where(resource => resource.Id == resourceId)
            .Select(resource => new ResourceAuditSnapshot
            {
                Id = resource.Id,
                Title = resource.Title,
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
                FilterValues = resource.ResourceFilterValues
                    .Select(resourceFilterValue => new ResourceAuditFilterValue
                    {
                        FilterDefinitionsId = resourceFilterValue.FilterDefinitionsId,
                        Key = resourceFilterValue.FilterDefinitions.Key,
                        FacetValuesId = resourceFilterValue.FacetValuesId,
                        FacetValue = resourceFilterValue.FacetValues != null ? resourceFilterValue.FacetValues.Value : null,
                        FacetLabel = resourceFilterValue.FacetValues != null ? resourceFilterValue.FacetValues.Label : null,
                        StringValue = resourceFilterValue.StringValue,
                        NumberValue = resourceFilterValue.NumberValue,
                        BooleanValue = resourceFilterValue.BooleanValue
                    })
                    .ToList(),
                Images = resource.Images
                    .Select(image => new ResourceAuditImage
                    {
                        Id = image.Id,
                        FileName = image.FileName,
                        OriginalFileName = image.OriginalFileName,
                        ContentType = image.ContentType,
                        UploadedAtUtc = image.UploadedAtUtc,
                        UploadedByUserId = image.UploadedByUserId,
                        IsDeleted = image.IsDeleted,
                        DeletedAtUtc = image.DeletedAtUtc,
                        DeletedByUserId = image.DeletedByUserId
                    })
                    .ToList()
            })
            .FirstOrDefaultAsync(ct);

        if (snapshot == null)
        {
            return null;
        }

        NormalizeSnapshot(snapshot);
        return snapshot;
    }

    public ResourceAuditEntry BuildEntry(
        Guid resourceId,
        ResourceAuditActionType actionType,
        ResourceAuditSnapshot? before,
        ResourceAuditSnapshot? after,
        string source,
        HttpContext? httpContext,
        string? reason = null,
        Guid? revertedAuditId = null,
        IReadOnlyList<string>? warnings = null)
    {
        var diff = BuildDiff(before, after, warnings);

        var actorDisplayName = ResolveDisplayName(httpContext?.User);
        var actorUserId = ResolveUserId(httpContext?.User);
        var actorRole = ResolveRole(httpContext?.User);

        var correlationId = GetHeaderValue(httpContext, "X-Correlation-ID")
            ?? httpContext?.TraceIdentifier;

        var userAgent = GetHeaderValue(httpContext, "User-Agent");
        var ipAddress = httpContext?.Connection?.RemoteIpAddress?.ToString();

        return new ResourceAuditEntry
        {
            ResourceId = resourceId,
            ActorUserId = actorUserId,
            ActorDisplayName = TrimToLength(actorDisplayName, 200),
            ActorRole = TrimToLength(actorRole, 64),
            ActionType = actionType,
            CreatedAtUtc = DateTime.UtcNow,
            Source = TrimToLength(source, 32) ?? string.Empty,
            CorrelationId = TrimToLength(correlationId, 200),
            IpAddress = TrimToLength(ipAddress, 64),
            UserAgent = TrimToLength(userAgent, 512),
            Reason = TrimToLength(reason, 500),
            BeforeJson = SerializeSnapshot(before),
            AfterJson = SerializeSnapshot(after),
            DiffJson = SerializeDiff(diff),
            RevertedAuditId = revertedAuditId
        };
    }

    public async Task TryWriteEntryAsync(ResourceAuditEntry entry, CancellationToken ct)
    {
        try
        {
            _dbContext.ResourceAuditEntries.Add(entry);
            await _dbContext.SaveChangesAsync(ct);
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "Failed to write audit entry for resource {ResourceId}.", entry.ResourceId);
        }
    }

    public ResourceAuditSnapshot? DeserializeSnapshot(string? json)
    {
        if (string.IsNullOrWhiteSpace(json))
        {
            return null;
        }

        return JsonSerializer.Deserialize<ResourceAuditSnapshot>(json, JsonOptions);
    }

    public List<ResourceAuditDiffItem> DeserializeDiff(string? json)
    {
        if (string.IsNullOrWhiteSpace(json))
        {
            return new List<ResourceAuditDiffItem>();
        }

        var diff = JsonSerializer.Deserialize<List<ResourceAuditDiffItem>>(json, JsonOptions) ?? new List<ResourceAuditDiffItem>();

        return diff
            .Select(item => new ResourceAuditDiffItem
            {
                Field = item.Field,
                Before = NormalizeJsonValue(item.Before),
                After = NormalizeJsonValue(item.After),
                Added = item.Added,
                Removed = item.Removed,
                Warnings = item.Warnings
            })
            .ToList();
    }

    private static void NormalizeSnapshot(ResourceAuditSnapshot snapshot)
    {
        snapshot.Tags = snapshot.Tags?
            .Where(tag => !string.IsNullOrWhiteSpace(tag))
            .OrderBy(tag => tag, StringComparer.OrdinalIgnoreCase)
            .ToList() ?? new List<string>();

        snapshot.FilterValues = snapshot.FilterValues?
            .OrderBy(value => value.Key, StringComparer.OrdinalIgnoreCase)
            .ThenBy(value => NormalizeFilterValue(value), StringComparer.OrdinalIgnoreCase)
            .ToList() ?? new List<ResourceAuditFilterValue>();

        snapshot.Images = snapshot.Images?
            .OrderBy(image => image.FileName, StringComparer.OrdinalIgnoreCase)
            .ThenBy(image => image.Id)
            .ToList() ?? new List<ResourceAuditImage>();
    }

    private static List<ResourceAuditDiffItem> BuildDiff(
        ResourceAuditSnapshot? before,
        ResourceAuditSnapshot? after,
        IReadOnlyList<string>? warnings)
    {
        var diff = new List<ResourceAuditDiffItem>();

        AddFieldDiff(diff, "title", before?.Title, after?.Title);
        AddFieldDiff(diff, "description", before?.Description, after?.Description);
        AddFieldDiff(diff, "url", before?.Url, after?.Url);
        AddFieldDiff(diff, "isFree", before?.IsFree, after?.IsFree);
        AddFieldDiff(diff, "year", before?.Year, after?.Year);
        AddFieldDiff(diff, "author", before?.Author, after?.Author);
        AddFieldDiff(diff, "learningStyle", before?.LearningStyle, after?.LearningStyle);
        AddFieldDiff(diff, "createdBy", before?.CreatedBy, after?.CreatedBy);
        AddFieldDiff(diff, "deletedAtUtc", before?.DeletedAtUtc, after?.DeletedAtUtc);
        AddFieldDiff(diff, "deletedBy", before?.DeletedBy, after?.DeletedBy);

        AddListDiff(diff, "tags", before?.Tags, after?.Tags, StringComparer.OrdinalIgnoreCase);
        AddListDiff(diff, "filterValues",
            NormalizeFilterValues(before?.FilterValues),
            NormalizeFilterValues(after?.FilterValues),
            StringComparer.OrdinalIgnoreCase);

        AddListDiff(diff, "images",
            NormalizeImages(before?.Images),
            NormalizeImages(after?.Images),
            StringComparer.OrdinalIgnoreCase,
            warnings);

        return diff;
    }

    private static void AddFieldDiff(List<ResourceAuditDiffItem> diff, string field, object? before, object? after)
    {
        if (Equals(before, after))
        {
            return;
        }

        diff.Add(new ResourceAuditDiffItem
        {
            Field = field,
            Before = before,
            After = after
        });
    }

    private static void AddListDiff(
        List<ResourceAuditDiffItem> diff,
        string field,
        IReadOnlyCollection<string>? before,
        IReadOnlyCollection<string>? after,
        IEqualityComparer<string> comparer,
        IReadOnlyList<string>? warnings = null)
    {
        var beforeSet = new HashSet<string>(before ?? Array.Empty<string>(), comparer);
        var afterSet = new HashSet<string>(after ?? Array.Empty<string>(), comparer);

        var orderComparer = comparer as IComparer<string> ?? StringComparer.OrdinalIgnoreCase;
        var added = afterSet.Except(beforeSet, comparer).OrderBy(value => value, orderComparer).ToList();
        var removed = beforeSet.Except(afterSet, comparer).OrderBy(value => value, orderComparer).ToList();

        if (added.Count == 0 && removed.Count == 0 && (warnings == null || warnings.Count == 0))
        {
            return;
        }

        diff.Add(new ResourceAuditDiffItem
        {
            Field = field,
            Added = added.Count == 0 ? null : added,
            Removed = removed.Count == 0 ? null : removed,
            Warnings = warnings == null || warnings.Count == 0 ? null : warnings.ToList()
        });
    }

    private static List<string> NormalizeFilterValues(IEnumerable<ResourceAuditFilterValue>? values)
    {
        if (values == null)
        {
            return new List<string>();
        }

        return values
            .Select(value => $"{value.Key}:{NormalizeFilterValue(value)}")
            .Where(value => !string.IsNullOrWhiteSpace(value))
            .Distinct(StringComparer.OrdinalIgnoreCase)
            .OrderBy(value => value, StringComparer.OrdinalIgnoreCase)
            .ToList();
    }

    private static string NormalizeFilterValue(ResourceAuditFilterValue value)
    {
        if (!string.IsNullOrWhiteSpace(value.FacetValue))
        {
            return value.FacetValue!;
        }

        if (value.BooleanValue.HasValue)
        {
            return value.BooleanValue.Value ? "true" : "false";
        }

        if (value.NumberValue.HasValue)
        {
            return value.NumberValue.Value.ToString("0.################", CultureInfo.InvariantCulture);
        }

        if (!string.IsNullOrWhiteSpace(value.StringValue))
        {
            return value.StringValue!;
        }

        return string.Empty;
    }

    private static List<string> NormalizeImages(IEnumerable<ResourceAuditImage>? images)
    {
        if (images == null)
        {
            return new List<string>();
        }

        return images
            .Select(image => $"{image.FileName} ({image.Id}){(image.IsDeleted ? " [deleted]" : string.Empty)}")
            .Distinct(StringComparer.OrdinalIgnoreCase)
            .OrderBy(value => value, StringComparer.OrdinalIgnoreCase)
            .ToList();
    }

    private static string? SerializeSnapshot(ResourceAuditSnapshot? snapshot)
    {
        if (snapshot == null)
        {
            return null;
        }

        return JsonSerializer.Serialize(snapshot, JsonOptions);
    }

    private static string SerializeDiff(List<ResourceAuditDiffItem> diff)
    {
        return JsonSerializer.Serialize(diff, JsonOptions);
    }

    private static string? ResolveDisplayName(ClaimsPrincipal? user)
    {
        if (user?.Identity?.IsAuthenticated != true)
        {
            return null;
        }

        return user.FindFirstValue(ClaimTypes.Name)
               ?? user.FindFirstValue(JwtRegisteredClaimNames.Name);
    }

    private static Guid? ResolveUserId(ClaimsPrincipal? user)
    {
        if (user?.Identity?.IsAuthenticated != true)
        {
            return null;
        }

        var idValue = user.FindFirstValue(ClaimTypes.NameIdentifier);
        return Guid.TryParse(idValue, out var parsedId) ? parsedId : null;
    }

    private static string? ResolveRole(ClaimsPrincipal? user)
    {
        if (user?.Identity?.IsAuthenticated != true)
        {
            return null;
        }

        if (user.IsInRole("Admin"))
        {
            return "admin";
        }

        var roleClaim = user.FindFirstValue(ClaimTypes.Role);
        return string.IsNullOrWhiteSpace(roleClaim) ? "user" : roleClaim.ToLowerInvariant();
    }

    private static string? GetHeaderValue(HttpContext? httpContext, string headerName)
    {
        if (httpContext == null)
        {
            return null;
        }

        if (!httpContext.Request.Headers.TryGetValue(headerName, out var value))
        {
            return null;
        }

        var raw = value.ToString();
        return string.IsNullOrWhiteSpace(raw) ? null : raw;
    }

    private static string? TrimToLength(string? value, int maxLength)
    {
        if (string.IsNullOrWhiteSpace(value))
        {
            return null;
        }

        var trimmed = value.Trim();
        return trimmed.Length <= maxLength ? trimmed : trimmed[..maxLength];
    }

    private static object? NormalizeJsonValue(object? value)
    {
        return value is JsonElement jsonElement
            ? ConvertJsonElement(jsonElement)
            : value;
    }

    private static object? ConvertJsonElement(JsonElement element)
    {
        return element.ValueKind switch
        {
            JsonValueKind.Null or JsonValueKind.Undefined => null,
            JsonValueKind.String => element.GetString(),
            JsonValueKind.True => true,
            JsonValueKind.False => false,
            JsonValueKind.Number => ConvertJsonNumber(element),
            JsonValueKind.Array => element
                .EnumerateArray()
                .Select(ConvertJsonElement)
                .ToList(),
            JsonValueKind.Object => element
                .EnumerateObject()
                .ToDictionary(
                    property => property.Name,
                    property => ConvertJsonElement(property.Value)),
            _ => element.ToString()
        };
    }

    private static object ConvertJsonNumber(JsonElement element)
    {
        if (element.TryGetInt32(out var intValue))
        {
            return intValue;
        }

        if (element.TryGetInt64(out var longValue))
        {
            return longValue;
        }

        if (element.TryGetDecimal(out var decimalValue))
        {
            return decimalValue;
        }

        if (element.TryGetDouble(out var doubleValue))
        {
            return doubleValue;
        }

        return element.GetRawText();
    }
}
