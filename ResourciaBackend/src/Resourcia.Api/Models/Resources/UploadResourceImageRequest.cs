using Microsoft.AspNetCore.Http;

namespace Resourcia.Api.Models.Resources;

public class UploadResourceImageRequest
{
    public IFormFile? File { get; set; }
}
