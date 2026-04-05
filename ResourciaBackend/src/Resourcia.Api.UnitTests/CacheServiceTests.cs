using System;
using System.Collections.Concurrent;
using System.Threading;
using System.Threading.Tasks;
using Microsoft.Extensions.Caching.Distributed;
using Resourcia.Api.Services;
using Xunit;

namespace Resourcia.Api.UnitTests;

public class CacheServiceTests
{
    [Fact]
    public async Task GetAsync_ReturnsNull_WhenMissing()
    {
        var service = new CacheService(new TestDistributedCache());

        var value = await service.GetAsync<string>("missing");

        Assert.Null(value);
    }

    [Fact]
    public async Task SetAsync_ThenGetAsync_RoundTripsValue()
    {
        var service = new CacheService(new TestDistributedCache());
        var payload = new TestPayload { Name = "Ada" };

        await service.SetAsync("payload", payload, TimeSpan.FromMinutes(5));
        var result = await service.GetAsync<TestPayload>("payload");

        Assert.NotNull(result);
        Assert.Equal("Ada", result!.Name);
    }

    [Fact]
    public async Task GetOrSetAsync_ReturnsCachedWithoutCallingFactory()
    {
        var service = new CacheService(new TestDistributedCache());
        await service.SetAsync("value", 5, TimeSpan.FromMinutes(5));
        var called = false;

        var result = await service.GetOrSetAsync(
            "value",
            () =>
            {
                called = true;
                return Task.FromResult(10);
            },
            TimeSpan.FromMinutes(5));

        Assert.False(called);
        Assert.Equal(5, result);
    }

    [Fact]
    public async Task GetOrSetAsync_CachesFactoryResult_WhenMissing()
    {
        var service = new CacheService(new TestDistributedCache());

        var result = await service.GetOrSetAsync(
            "value",
            () => Task.FromResult(42),
            TimeSpan.FromMinutes(5));
        var cached = await service.GetAsync<int>("value");

        Assert.Equal(42, result);
        Assert.Equal(42, cached);
    }

    [Fact]
    public async Task InvalidateAsync_RemovesKey()
    {
        var service = new CacheService(new TestDistributedCache());
        await service.SetAsync("key", "value", TimeSpan.FromMinutes(5));

        await service.InvalidateAsync("key");
        var result = await service.GetAsync<string>("key");

        Assert.Null(result);
    }

    [Fact]
    public async Task GetNamespaceVersionAsync_InitializesAndPersists()
    {
        var service = new CacheService(new TestDistributedCache());

        var version = await service.GetNamespaceVersionAsync("reviews");
        var again = await service.GetNamespaceVersionAsync("reviews");

        Assert.Equal("0", version);
        Assert.Equal(version, again);
    }

    [Fact]
    public async Task InvalidateNamespaceAsync_ChangesVersion()
    {
        var service = new CacheService(new TestDistributedCache());
        var version = await service.GetNamespaceVersionAsync("resources");

        await service.InvalidateNamespaceAsync("resources");
        var updated = await service.GetNamespaceVersionAsync("resources");

        Assert.NotEqual(version, updated);
    }

    private sealed class TestPayload
    {
        public string Name { get; set; } = string.Empty;
    }

    private sealed class TestDistributedCache : IDistributedCache
    {
        private readonly ConcurrentDictionary<string, byte[]> _store = new();

        public byte[]? Get(string key)
        {
            if (_store.TryGetValue(key, out var value))
            {
                return value;
            }

            return null;
        }

        public Task<byte[]?> GetAsync(string key, CancellationToken token = default)
            => Task.FromResult(Get(key));

        public void Set(string key, byte[] value, DistributedCacheEntryOptions options)
            => _store[key] = value;

        public Task SetAsync(string key, byte[] value, DistributedCacheEntryOptions options, CancellationToken token = default)
        {
            Set(key, value, options);
            return Task.CompletedTask;
        }

        public void Refresh(string key)
        {
        }

        public Task RefreshAsync(string key, CancellationToken token = default) => Task.CompletedTask;

        public void Remove(string key) => _store.TryRemove(key, out _);

        public Task RemoveAsync(string key, CancellationToken token = default)
        {
            Remove(key);
            return Task.CompletedTask;
        }
    }
}
