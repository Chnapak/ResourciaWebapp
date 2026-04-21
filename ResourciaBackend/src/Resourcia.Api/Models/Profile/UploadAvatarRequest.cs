using Microsoft.AspNetCore.Http;

namespace Resourcia.Api.Models.Profile;

public class UploadAvatarRequest
{
    public IFormFile? File { get; set; }
}
