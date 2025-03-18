using NodaTime;

namespace ResourciaApi.Api.Utils;

public interface IApplicationMapper
{
    public Instant Now { get; }
}

public class ApplicationMapper(IClock Clock) : IApplicationMapper
{
    public Instant Now => Clock.GetCurrentInstant();
}