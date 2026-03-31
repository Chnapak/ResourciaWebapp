namespace Resourcia.Api.Options;

public class RedisOptions
{
    public required string ConnectionString { get; set; }
    public int DefaultTtlMinutes { get; set; } = 10;
}
