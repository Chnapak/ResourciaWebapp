using System;
using System.Security.Claims;
using Resourcia.Api.Utils;
using Xunit;

namespace Resourcia.Api.UnitTests;

public class ClaimsPrincipalExtensionsTests
{
    [Fact]
    public void GetName_Throws_WhenUserNotAuthenticated()
    {
        var principal = new ClaimsPrincipal(new ClaimsIdentity());

        var ex = Assert.Throws<InvalidOperationException>(() => principal.GetName());

        Assert.Equal("user not logged in", ex.Message);
    }

    [Fact]
    public void GetName_ReturnsClaimValue()
    {
        var principal = BuildPrincipal(
            new Claim(ClaimTypes.Name, "alice"),
            new Claim(ClaimTypes.NameIdentifier, Guid.NewGuid().ToString())
        );

        var name = principal.GetName();

        Assert.Equal("alice", name);
    }

    [Fact]
    public void GetUserId_ReturnsParsedGuid()
    {
        var id = Guid.NewGuid();
        var principal = BuildPrincipal(
            new Claim(ClaimTypes.Name, "bob"),
            new Claim(ClaimTypes.NameIdentifier, id.ToString())
        );

        var actual = principal.GetUserId();

        Assert.Equal(id, actual);
    }

    private static ClaimsPrincipal BuildPrincipal(params Claim[] claims)
    {
        var identity = new ClaimsIdentity(claims, authenticationType: "TestAuth");
        return new ClaimsPrincipal(identity);
    }
}
