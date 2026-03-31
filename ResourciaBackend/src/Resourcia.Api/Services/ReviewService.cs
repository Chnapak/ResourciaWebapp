using Microsoft.EntityFrameworkCore;
using NodaTime;
using Resourcia.Api.Models.Resources;
using Resourcia.Data;
using Resourcia.Data.Entities;

namespace Resourcia.Api.Services;

/// <summary>
/// Encapsulates all review business logic: CRUD, voting, and atomic rating recomputation.
/// </summary>
public class ReviewService
{
    private readonly AppDbContext _db;
    private readonly IClock _clock;

    public ReviewService(AppDbContext db, IClock clock)
    {
        _db = db;
        _clock = clock;
    }

    // -------------------------------------------------------------------------
    // Queries
    // -------------------------------------------------------------------------

    public async Task<(List<ReviewResponseModel> Items, int TotalItems)> GetReviewsAsync(
        Guid resourceId,
        int page,
        int pageSize,
        string sortBy,
        Guid? userId = null,
        CancellationToken ct = default)
    {
        var query = _db.ResourceReviews
            .Where(r => r.ResourceId == resourceId);

        query = sortBy switch
        {
            "helpful" => query.OrderByDescending(r => r.Votes.Count(v => v.IsHelpful)),
            "newest"  => query.OrderByDescending(r => r.CreatedAt),
            "rating"  => query.OrderByDescending(r => r.Rating),
            _         => query.OrderByDescending(r => r.CreatedAt)
        };

        var totalItems = await query.CountAsync(ct);

        var items = await query
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .Select(r => new ReviewResponseModel
            {
                Id         = r.Id,
                ResourceId = r.ResourceId,
                UserId     = r.UserId,
                Username   = r.User.DisplayName,
                Rating     = r.Rating,
                Content    = r.Content,
                CreatedAt  = r.CreatedAt,
                UpdatedAt  = r.UpdatedAt,
                Upvotes = _db.ReviewsVotes.Count(v => v.ReviewId == r.Id && v.IsHelpful),
                Downvotes = _db.ReviewsVotes.Count(v => v.ReviewId == r.Id && !v.IsHelpful),
                UserVote = userId == null ? null
              : _db.ReviewsVotes
                  .Where(v => v.ReviewId == r.Id && v.UserId == userId)
                  .Select(v => (bool?)v.IsHelpful)
                  .FirstOrDefault()
            })
            .ToListAsync(ct);

        return (items, totalItems);
    }

    // -------------------------------------------------------------------------
    // Create
    // -------------------------------------------------------------------------

    /// <returns>The created review, or an error string.</returns>
    public async Task<(ResourceReview? Review, string? Error, int StatusCode)> CreateReviewAsync(
        Guid resourceId,
        Guid userId,
        CreateReviewModel model,
        CancellationToken ct = default)
    {
        var resourceExists = await _db.Resources
            .AsNoTracking()
            .AnyAsync(r => r.Id == resourceId, ct);

        if (!resourceExists)
            return (null, "Resource not found.", 404);

        var alreadyReviewed = await _db.ResourceReviews
            .AnyAsync(r => r.ResourceId == resourceId && r.UserId == userId, ct);

        if (alreadyReviewed)
            return (null, "You have already reviewed this resource.", 409);

        var now = _clock.GetCurrentInstant();
        var review = new ResourceReview
        {
            Id         = Guid.NewGuid(),
            ResourceId = resourceId,
            UserId     = userId,
            Rating     = model.Rating,
            Content    = model.Content.Trim(),
            CreatedAt  = now,
            UpdatedAt  = now,
        };

        await using var tx = await _db.Database.BeginTransactionAsync(ct);
        try
        {
            _db.ResourceReviews.Add(review);
            await _db.SaveChangesAsync(ct);
            await RecomputeRatingsAsync(resourceId, ct);
            await tx.CommitAsync(ct);
        }
        catch
        {
            await tx.RollbackAsync(ct);
            return (null, "Failed to save review.", 500);
        }

        return (review, null, 201);
    }

    // -------------------------------------------------------------------------
    // Update (author only — caller must enforce this)
    // -------------------------------------------------------------------------

    /// <returns>Updated review, or an error string.</returns>
    public async Task<(ResourceReview? Review, string? Error, int StatusCode)> UpdateReviewAsync(
        Guid reviewId,
        Guid userId,
        UpdateReviewModel model,
        CancellationToken ct = default)
    {
        var review = await _db.ResourceReviews
            .FirstOrDefaultAsync(r => r.Id == reviewId, ct);

        if (review == null)
            return (null, "Review not found.", 404);

        if (review.UserId != userId)
            return (null, "Forbidden.", 403);

        review.Rating    = model.Rating;
        review.Content   = model.Content.Trim();
        review.UpdatedAt = _clock.GetCurrentInstant();

        await using var tx = await _db.Database.BeginTransactionAsync(ct);
        try
        {
            await _db.SaveChangesAsync(ct);
            await RecomputeRatingsAsync(review.ResourceId, ct);
            await tx.CommitAsync(ct);
        }
        catch
        {
            await tx.RollbackAsync(ct);
            return (null, "Failed to update review.", 500);
        }

        return (review, null, 200);
    }

    // -------------------------------------------------------------------------
    // Delete (author or admin)
    // -------------------------------------------------------------------------

    public async Task<(bool Success, string? Error, int StatusCode)> DeleteReviewAsync(
        Guid reviewId,
        Guid userId,
        bool isAdmin,
        CancellationToken ct = default)
    {
        var review = await _db.ResourceReviews
            .FirstOrDefaultAsync(r => r.Id == reviewId, ct);

        if (review == null)
            return (false, "Review not found.", 404);

        if (!isAdmin && review.UserId != userId)
            return (false, "Forbidden.", 403);

        var resourceId = review.ResourceId;

        await using var tx = await _db.Database.BeginTransactionAsync(ct);
        try
        {
            // Remove associated votes first (no cascade configured for votes)
            var votes = _db.ReviewsVotes.Where(v => v.ReviewId == reviewId);
            _db.ReviewsVotes.RemoveRange(votes);
            _db.ResourceReviews.Remove(review);
            await _db.SaveChangesAsync(ct);
            await RecomputeRatingsAsync(resourceId, ct);
            await tx.CommitAsync(ct);
        }
        catch
        {
            await tx.RollbackAsync(ct);
            return (false, "Failed to delete review.", 500);
        }

        return (true, null, 204);
    }

    // -------------------------------------------------------------------------
    // Votes — toggle semantics: same vote removes it, different vote flips it
    // -------------------------------------------------------------------------

    public async Task<(int Upvotes, int Downvotes, string? Error, int StatusCode)> VoteAsync(
        Guid reviewId,
        Guid userId,
        bool isHelpful,
        CancellationToken ct = default)
    {
        var reviewExists = await _db.ResourceReviews
            .AnyAsync(r => r.Id == reviewId, ct);

        if (!reviewExists)
            return (0, 0, "Review not found.", 404);

        var existing = await _db.ReviewsVotes
            .FirstOrDefaultAsync(v => v.ReviewId == reviewId && v.UserId == userId, ct);

        if (existing != null)
        {
            if (existing.IsHelpful == isHelpful)
                _db.ReviewsVotes.Remove(existing);   // same vote → toggle off
            else
                existing.IsHelpful = isHelpful;      // flip vote
        }
        else
        {
            _db.ReviewsVotes.Add(new ReviewVotes
            {
                Id        = Guid.NewGuid(),
                ReviewId  = reviewId,
                UserId    = userId,
                IsHelpful = isHelpful,
            });
        }

        await _db.SaveChangesAsync(ct);

        var upvotes   = await _db.ReviewsVotes.CountAsync(v => v.ReviewId == reviewId && v.IsHelpful, ct);
        var downvotes = await _db.ReviewsVotes.CountAsync(v => v.ReviewId == reviewId && !v.IsHelpful, ct);

        return (upvotes, downvotes, null, 200);
    }

    public async Task<(bool Success, string? Error, int StatusCode)> DeleteVoteAsync(
        Guid reviewId,
        Guid userId,
        CancellationToken ct = default)
    {
        var vote = await _db.ReviewsVotes
            .FirstOrDefaultAsync(v => v.ReviewId == reviewId && v.UserId == userId, ct);

        if (vote == null)
            return (false, "Vote not found.", 404);

        _db.ReviewsVotes.Remove(vote);
        await _db.SaveChangesAsync(ct);
        return (true, null, 204);
    }

    // -------------------------------------------------------------------------
    // Private helpers
    // -------------------------------------------------------------------------

    /// <summary>
    /// Atomically recomputes <see cref="ResourceRatings"/> from the current set of reviews.
    /// Must be called inside an open transaction.
    /// </summary>
    private async Task RecomputeRatingsAsync(Guid resourceId, CancellationToken ct)
    {
        var stats = await _db.ResourceReviews
            .Where(r => r.ResourceId == resourceId)
            .GroupBy(r => r.ResourceId)
            .Select(g => new
            {
                Count  = g.Count(),
                Avg    = g.Average(x => (double)x.Rating),
                Count1 = g.Count(x => x.Rating == 1),
                Count2 = g.Count(x => x.Rating == 2),
                Count3 = g.Count(x => x.Rating == 3),
                Count4 = g.Count(x => x.Rating == 4),
                Count5 = g.Count(x => x.Rating == 5),
            })
            .FirstOrDefaultAsync(ct);

        var entity = await _db.ResourceRatings
            .FirstOrDefaultAsync(r => r.ResourceId == resourceId, ct);

        if (stats == null)
        {
            // All reviews deleted — reset counters rather than remove the row,
            // so the 1-to-1 FK invariant is preserved.
            if (entity != null)
            {
                entity.TotalCount    = 0;
                entity.AverageRating = 0;
                entity.Count1        = 0;
                entity.Count2        = 0;
                entity.Count3        = 0;
                entity.Count4        = 0;
                entity.Count5        = 0;
                await _db.SaveChangesAsync(ct);
            }
            return;
        }

        if (entity == null)
        {
            entity = new ResourceRatings { ResourceId = resourceId };
            _db.ResourceRatings.Add(entity);
        }

        entity.TotalCount    = stats.Count;
        entity.AverageRating = (float)stats.Avg;
        entity.Count1        = stats.Count1;
        entity.Count2        = stats.Count2;
        entity.Count3        = stats.Count3;
        entity.Count4        = stats.Count4;
        entity.Count5        = stats.Count5;

        await _db.SaveChangesAsync(ct);
    }
}
