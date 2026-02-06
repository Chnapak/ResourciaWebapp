using System.ComponentModel.DataAnnotations;
using Resourcia.Data.Entities;

namespace Resourcia.Api.Models.Posts;

public class CreatePostModel
{
    [Required(AllowEmptyStrings = false, ErrorMessage = "Příspěvek musí mít nějaký text!")]
    [MaxLength(Post.Metadata.ContentLength)]
    public string Content { get; set; } = null!;
}
