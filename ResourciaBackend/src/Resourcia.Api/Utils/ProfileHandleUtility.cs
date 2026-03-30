using System.Text.RegularExpressions;

namespace Resourcia.Api.Utils;

public static partial class ProfileHandleUtility
{
    [GeneratedRegex("[^a-z0-9._-]+", RegexOptions.Compiled)]
    private static partial Regex InvalidHandleCharacters();

    public static string BuildHandle(string value)
    {
        var normalized = value.Trim().ToLowerInvariant().Replace(" ", string.Empty);
        normalized = InvalidHandleCharacters().Replace(normalized, string.Empty);
        return normalized;
    }
}
