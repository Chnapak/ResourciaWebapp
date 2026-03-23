using Resourcia.Api.Utils;
using System.ComponentModel.DataAnnotations;
using Resourcia.Data.Entities;

namespace Resourcia.Api.Models.Posts;

public class DetailPostModel
{
    public Guid Id { get; set; }
    public string AuthorName { get; set; } = null!;
    public string Content { get; set; } = null!;
    public string CreatedAt { get; set; } = null!;
    public string ModifiedAt { get; set; } = null!;
}

public static class DetailPostModelExtensions
{
    public static DetailPostModel ToDetail(this IApplicationMapper mapper, Post source)
        => new()
    {
        Id = source.Id,
        AuthorName = source.Author.DisplayName,
        Content = source.Content,
        CreatedAt = source.CreatedAt.ToString(),
        ModifiedAt = source.ModifiedAt.ToString(),
    };
}
