using Microsoft.Extensions.Options;
using Resourcia.Api.Options;

namespace Resourcia.Api.Services;

public class APIService
{
    private readonly CloudflareOptions _cloudflareOptions;
    private readonly HttpClient _httpClient;

    public APIService(IOptions<CloudflareOptions> cloudflareOptions ,HttpClient httpClient)
    {
        _cloudflareOptions = cloudflareOptions.Value;
        _httpClient = httpClient;
    }
    public async Task<bool> VerifyCaptchaAsync(string token, string ip)
    {
        var requestBody = new Dictionary<string, string>
       {
           { "response", token },
           { "secret",  _cloudflareOptions.SecretKey },
           { "remoteip", ip }
       };

        var content = new FormUrlEncodedContent(requestBody);
        var response = await _httpClient.PostAsync(_cloudflareOptions.Host + "siteverify", content);

        return (!response.IsSuccessStatusCode) ? false : true;
    }
}
