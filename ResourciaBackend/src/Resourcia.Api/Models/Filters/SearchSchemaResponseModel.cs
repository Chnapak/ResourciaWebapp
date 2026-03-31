namespace Resourcia.Api.Models.Filters;

public class SearchSchemaResponseModel
{
    public List<SearchSchemaFilterModel> Filters { get; set; } = new();
}

public class SearchSchemaFilterModel
{
    public string Key { get; set; } = string.Empty;
    public string Label { get; set; } = string.Empty;
    public string Kind { get; set; } = string.Empty;
    public bool IsMulti { get; set; }
    public string? ResourceField { get; set; }
    public List<SearchSchemaFilterValueModel> Values { get; set; } = new();
}

public class SearchSchemaFilterValueModel
{
    public string Value { get; set; } = string.Empty;
    public string Label { get; set; } = string.Empty;
}
