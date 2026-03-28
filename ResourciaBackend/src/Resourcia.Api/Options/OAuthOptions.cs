namespace Resourcia.Api.Options;

public class OAuthOptions
{
    public GoogleOptions Google { get; set; } = new();
    public FacebookOptions Facebook { get; set; } = new();

    public class GoogleOptions
    {
        public string ClientId { get; set; } = string.Empty;
        public string ClientSecret { get; set; } = string.Empty;
    }

    public class FacebookOptions
    {
        public string AppId { get; set; } = string.Empty;
        public string AppSecret { get; set; } = string.Empty;
    }
}