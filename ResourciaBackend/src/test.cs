using System;
using Microsoft.Extensions.Configuration;
using System.Collections.Generic;

var config = new ConfigurationBuilder()
    .AddInMemoryCollection(new Dictionary<string, string>
    {
        { "OAuthSettings.Google.ClientId", "12345" }
    })
    .Build();

var settings = config.GetSection("OAuthSettings").Get<OAuthSettings>();
Console.WriteLine($"Result: {settings?.Google?.ClientId ?? "NULL"}");

public class OAuthSettings { public GoogleSettings Google { get; set; } }
public class GoogleSettings { public string ClientId { get; set; } }
