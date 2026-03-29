using Microsoft.Extensions.Caching.Distributed;
using System.Text.Json;

namespace Resourcia.Api.Services;

public class CacheService(IDistributedCache cache)
{
    private static readonly JsonSerializerOptions _json = new() { PropertyNameCaseInsensitive = true };

    public async Task<T?> GetAsync<T>(string key)
    {
        var value = await cache.GetStringAsync(key, CancellationToken.None);
        return value is null ? default : JsonSerializer.Deserialize<T>(value, _json);
    }

    public async Task SetAsync<T>(string key, T value, TimeSpan ttl)
    {
        var serialized = JsonSerializer.Serialize(value, _json);
        await cache.SetStringAsync(key, serialized, new DistributedCacheEntryOptions
        {
            AbsoluteExpirationRelativeToNow = ttl
        }, CancellationToken.None);
    }

    public async Task<T> GetOrSetAsync<T>(string key, Func<Task<T>> fetchFn, TimeSpan ttl)
    {
        var cached = await GetAsync<T>(key);
        if (cached is not null) return cached;

        var data = await fetchFn();         // ct lives here, inside the lambda at the call site
        await SetAsync(key, data, ttl);
        return data;
    }

    public async Task InvalidateAsync(string key) =>
        await cache.RemoveAsync(key, CancellationToken.None);
}
