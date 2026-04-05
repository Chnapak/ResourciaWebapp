using NodaTime;
using Resourcia.Api.Utils;
using Xunit;

namespace Resourcia.Api.UnitTests;

public class ApplicationMapperTests
{
    [Fact]
    public void Now_ReturnsClockInstant()
    {
        var instant = Instant.FromUtc(2026, 4, 5, 12, 0);
        var clock = new FixedClock(instant);
        var mapper = new ApplicationMapper(clock);

        Assert.Equal(instant, mapper.Now);
    }

    private sealed class FixedClock : IClock
    {
        private readonly Instant _instant;

        public FixedClock(Instant instant)
        {
            _instant = instant;
        }

        public Instant GetCurrentInstant() => _instant;
    }
}
