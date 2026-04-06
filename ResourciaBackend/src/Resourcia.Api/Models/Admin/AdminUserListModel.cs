namespace Resourcia.Api.Models.Admin;

public class AdminUserListItemModel
{
    public string Id { get; set; } = string.Empty;

    public string Name { get; set; } = string.Empty;

    public string Handle { get; set; } = string.Empty;

    public string Email { get; set; } = string.Empty;

    public string Role { get; set; } = "contributor";

    public string RoleLabel { get; set; } = "Contributor";

    public string Status { get; set; } = "active";

    public string? AvatarUrl { get; set; }

    public int ResourcesCount { get; set; }

    public DateTime LastActiveAt { get; set; }
}

public class AdminUserListResponseModel
{
    public List<AdminUserListItemModel> Items { get; set; } = [];

    public int TotalCount { get; set; }

    public int Page { get; set; }

    public int PageSize { get; set; }
}
