using Microsoft.Extensions.Options;
using Resourcia.Api.Options;
using System.Net.Http.Json;
using System.Text.Json.Serialization;

namespace Resourcia.Api.Services;

public class CaptchaService
{
    private readonly CloudflareOptions _cloudflareOptions;
    private readonly HttpClient _httpClient;

    public CaptchaService(IOptions<CloudflareOptions> cloudflareOptions, HttpClient httpClient)
    {
        _cloudflareOptions = cloudflareOptions.Value;
        _httpClient = httpClient;
    }
    public async Task<bool> VerifyCaptchaAsync(string token, string ip)
    {
        if (string.IsNullOrWhiteSpace(token) || string.IsNullOrWhiteSpace(_cloudflareOptions.SecretKey))
        {
            return false;
        }

        var requestBody = new Dictionary<string, string>
       {
           { "response", token },
           { "secret",  _cloudflareOptions.SecretKey },
           { "remoteip", ip }
       };

        var content = new FormUrlEncodedContent(requestBody);
        var response = await _httpClient.PostAsync(_cloudflareOptions.Host + "siteverify", content);

        if (!response.IsSuccessStatusCode)
        {
            return false;
        }

        var payload = await response.Content.ReadFromJsonAsync<TurnstileVerifyResponse>();
        return payload?.Success == true;
    }

    private sealed class TurnstileVerifyResponse
    {
        [JsonPropertyName("success")]
        public bool Success { get; set; }

        [JsonPropertyName("error-codes")]
        public string[]? ErrorCodes { get; set; }
    }
}