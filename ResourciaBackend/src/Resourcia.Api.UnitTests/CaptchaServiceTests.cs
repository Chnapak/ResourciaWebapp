using System;
using System.Net;
using System.Net.Http;
using System.Threading;
using System.Threading.Tasks;
using Microsoft.Extensions.Options;
using Resourcia.Api.Options;
using Resourcia.Api.Services;
using Xunit;

namespace Resourcia.Api.UnitTests;

public class CaptchaServiceTests
{
    [Fact]
    public async Task VerifyCaptchaAsync_ReturnsTrue_WhenResponseIsSuccessful()
    {
        var handler = new StubHttpMessageHandler(_ => new HttpResponseMessage(HttpStatusCode.OK)
        {
            Content = new StringContent("{\"success\":true}")
        });
        var httpClient = new HttpClient(handler);
        var options = Microsoft.Extensions.Options.Options.Create(new CloudflareOptions
        {
            Host = "https://captcha.example/",
            SecretKey = "secret"
        });
        var service = new CaptchaService(options, httpClient);

        var result = await service.VerifyCaptchaAsync("token", "127.0.0.1");

        Assert.True(result);
        Assert.NotNull(handler.LastRequest);
        Assert.Equal("https://captcha.example/siteverify", handler.LastRequest!.RequestUri!.ToString());

        var body = await handler.LastRequest.Content!.ReadAsStringAsync();
        Assert.Contains("response=token", body);
        Assert.Contains("secret=secret", body);
        Assert.Contains("remoteip=127.0.0.1", body);
    }

    [Fact]
    public async Task VerifyCaptchaAsync_ReturnsFalse_WhenResponseIsFailure()
    {
        var handler = new StubHttpMessageHandler(_ => new HttpResponseMessage(HttpStatusCode.BadRequest));
        var httpClient = new HttpClient(handler);
        var options = Microsoft.Extensions.Options.Options.Create(new CloudflareOptions
        {
            Host = "https://captcha.example/",
            SecretKey = "secret"
        });
        var service = new CaptchaService(options, httpClient);

        var result = await service.VerifyCaptchaAsync("token", "127.0.0.1");

        Assert.False(result);
    }

    private sealed class StubHttpMessageHandler : HttpMessageHandler
    {
        private readonly Func<HttpRequestMessage, HttpResponseMessage> _handler;

        public StubHttpMessageHandler(Func<HttpRequestMessage, HttpResponseMessage> handler)
        {
            _handler = handler;
        }

        public HttpRequestMessage? LastRequest { get; private set; }

        protected override Task<HttpResponseMessage> SendAsync(HttpRequestMessage request, CancellationToken cancellationToken)
        {
            LastRequest = request;
            return Task.FromResult(_handler(request));
        }
    }
}
