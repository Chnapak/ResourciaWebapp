using Resourcia.Api.Utils;
using Xunit;

namespace Resourcia.Api.UnitTests;

public class FilterResourceFieldResolverTests
{
    [Fact]
    public void Resolve_MapsConfiguredField_WhenKnown()
    {
        var result = FilterResourceFieldResolver.Resolve("  tItLe ", "free", "label");

        Assert.Equal("Title", result);
    }

    [Fact]
    public void Resolve_ReturnsTrimmedConfiguredField_WhenUnknown()
    {
        var result = FilterResourceFieldResolver.Resolve("  CustomField  ", "title", "label");

        Assert.Equal("CustomField", result);
    }

    [Fact]
    public void Resolve_UsesKey_WhenConfiguredMissing()
    {
        var result = FilterResourceFieldResolver.Resolve(null, "freeOnly", null);

        Assert.Equal("IsFree", result);
    }

    [Fact]
    public void Resolve_UsesLabel_WhenKeyMissing()
    {
        var result = FilterResourceFieldResolver.Resolve(null, "unknown", "Save Count");

        Assert.Equal("SavesCount", result);
    }

    [Fact]
    public void Resolve_ReturnsNull_WhenNoMatch()
    {
        var result = FilterResourceFieldResolver.Resolve(null, "unknown", "still unknown");

        Assert.Null(result);
    }
}
