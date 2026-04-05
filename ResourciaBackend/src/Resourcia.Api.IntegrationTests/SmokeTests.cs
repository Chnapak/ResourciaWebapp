using System.Net;
using System.Net.Http;
using System.Threading.Tasks;
using Xunit;

namespace Resourcia.Api.IntegrationTests;

public class SmokeTests : IClassFixture<ApiWebApplicationFactory>
{
    private readonly HttpClient _client;

    public SmokeTests(ApiWebApplicationFactory factory)
    {
        _client = factory.CreateClient();
    }

    [Fact]
    public async Task Get_root_returns_404()
    {
        var response = await _client.GetAsync("/");

        Assert.Equal(HttpStatusCode.NotFound, response.StatusCode);
    }
}
