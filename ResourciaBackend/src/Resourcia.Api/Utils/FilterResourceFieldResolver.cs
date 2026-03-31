using System.Linq;

namespace Resourcia.Api.Utils;

internal static class FilterResourceFieldResolver
{
    private static readonly Dictionary<string, string> KnownFields = new(StringComparer.OrdinalIgnoreCase)
    {
        ["author"] = "Author",
        ["createdby"] = "CreatedBy",
        ["addedby"] = "CreatedBy",
        ["description"] = "Description",
        ["domain"] = "Url",
        ["free"] = "IsFree",
        ["freeonly"] = "IsFree",
        ["isfree"] = "IsFree",
        ["learningstyle"] = "LearningStyle",
        ["link"] = "Url",
        ["rating"] = "Rating",
        ["ratings"] = "Rating",
        ["savecount"] = "SavesCount",
        ["saves"] = "SavesCount",
        ["savescount"] = "SavesCount",
        ["tag"] = "Tags",
        ["tags"] = "Tags",
        ["title"] = "Title",
        ["url"] = "Url",
        ["year"] = "Year"
    };

    public static string? Resolve(string? configuredResourceField, string? key, string? label = null)
    {
        if (!string.IsNullOrWhiteSpace(configuredResourceField))
        {
            var normalizedConfiguredField = Normalize(configuredResourceField);
            if (normalizedConfiguredField != null && KnownFields.TryGetValue(normalizedConfiguredField, out var mappedConfiguredField))
            {
                return mappedConfiguredField;
            }

            return configuredResourceField.Trim();
        }

        foreach (var candidate in new[] { key, label })
        {
            var normalizedCandidate = Normalize(candidate);
            if (normalizedCandidate != null && KnownFields.TryGetValue(normalizedCandidate, out var mappedField))
            {
                return mappedField;
            }
        }

        return null;
    }

    private static string? Normalize(string? value)
    {
        if (string.IsNullOrWhiteSpace(value))
        {
            return null;
        }

        return new string(value.Where(char.IsLetterOrDigit).ToArray()).ToLowerInvariant();
    }
}
