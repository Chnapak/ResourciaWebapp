using System;
using System.Collections.Generic;
using System.IO;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Http;
using SixLabors.ImageSharp;
using SixLabors.ImageSharp.Processing;
using SixLabors.ImageSharp.Formats;
using SixLabors.ImageSharp.Formats.Jpeg;
using SixLabors.ImageSharp.Formats.Png;
using SixLabors.ImageSharp.Formats.Gif;

namespace Resourcia.Api.Services;

public class ImageService
{
    private readonly string _imageStoragePath;

    public ImageService(string imageStoragePath)
    {
        _imageStoragePath = imageStoragePath ?? throw new ArgumentNullException(nameof(imageStoragePath));
        Directory.CreateDirectory(_imageStoragePath); // ensure folder exists
    }

    private static readonly HashSet<string> AllowedExtensions = new()
    {
        ".png", ".jpg", ".jpeg", ".gif"
    };

    private static readonly HashSet<string> AllowedMimeTypes = new()
    {
        "image/png",
        "image/jpeg",
        "image/gif"
    };

    private const long MaxFileSize = 5 * 1024 * 1024; // 5 MB

    public bool IsValidImage(IFormFile file)
    {
        if (file.Length == 0 || file.Length > MaxFileSize)
            return false;

        var ext = Path.GetExtension(file.FileName).ToLowerInvariant();
        if (!AllowedExtensions.Contains(ext))
            return false;

        try
        {
            using var stream = file.OpenReadStream();
            // ImageInfo is not IDisposable — no 'using'
            var info = Image.Identify(stream);
            if (info == null) return false;

            var format = info.Metadata.DecodedImageFormat;
            if (format == null) return false;

            var mime = format.DefaultMimeType.ToLowerInvariant();
            return AllowedMimeTypes.Contains(mime);
        }
        catch
        {
            return false;
        }
    }

    public async Task<string> SaveImageAsync(IFormFile file)
    {
        var extension = Path.GetExtension(file.FileName).ToLowerInvariant();
        var safeFileName = $"{Guid.NewGuid()}{extension}";
        var savePath = Path.Combine(_imageStoragePath, safeFileName);

        using var stream = file.OpenReadStream();
        // Image.Load(stream) — format retrieved from metadata after load
        using var image = Image.Load(stream);

        var format = image.Metadata.DecodedImageFormat
            ?? throw new InvalidOperationException("Could not determine image format.");

        if (image.Width > 1200)
            image.Mutate(x => x.Resize(1200, 0));

        IImageEncoder encoder = format.Name switch
        {
            "JPEG" => new JpegEncoder { Quality = 90 },
            "PNG" => new PngEncoder { CompressionLevel = PngCompressionLevel.Level6 },
            "GIF" => new GifEncoder(),
            _ => throw new InvalidOperationException($"Unsupported image format: {format.Name}")
        };

        await image.SaveAsync(savePath, encoder);
        return safeFileName;
    }
}