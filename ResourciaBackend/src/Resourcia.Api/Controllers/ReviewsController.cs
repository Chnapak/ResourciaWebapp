using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Resourcia.Api.Models.Resources;
using Resourcia.Api.Services;
using Resourcia.Api.Utils;
using Resourcia.Data;

namespace Resourcia.Api.Controllers;

/// <summary>
/// Handles all review and vote operations for a resource.
///
/// Architecture-spec routes (primary):
///   GET    /api/resources/{id}/reviews
///   POST   /api/resources/{id}/reviews
///   PATCH  /api/resources/{id}/reviews/{reviewId}
///   DELETE /api/resources/{id}/reviews/{reviewId}
///   POST   /api/resources/{id}/reviews/{reviewId}/votes
///   DELETE /api/resources/{id}/reviews/{reviewId}/votes
///
/// Legacy aliases kept for Angular frontend backward-compatibility:
///   POST   /api/resource/reviews/{reviewId}/vote   → VoteLegacy
///   DELETE /api/resource/reviews/{reviewId}/vote   → DeleteVoteLegacy
///   DELETE /api/resource/{id}/reviews              → DeleteReviewLegacy (by resourceId+userId)
/// </summary>
[ApiController]
public class ReviewsController : ControllerBase
{
    private readonly ReviewService _reviews;
    private readonly AppDbContext _db;

    public ReviewsController(ReviewService reviews, AppDbContext db)
    {
        _reviews = reviews;
        _db      = db;
    }

    // =========================================================================
    // GET /api/resources/{id}/reviews  — public
    // =========================================================================

    [HttpGet("api/resources/{id:guid}/reviews")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    public async Task<IActionResult> GetReviews(
        Guid id,
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 10,
        [FromQuery] string sortBy = "helpful",
        CancellationToken ct = default)
    {
        page     = Math.Max(1, page);
        pageSize = Math.Clamp(pageSize, 1, 100);

        var (items, totalItems) = await _reviews.GetReviewsAsync(id, page, pageSize, sortBy, ct);

        return Ok(new { items, page, pageSize, totalItems });
    }

    // =========================================================================
    // POST /api/resources/{id}/reviews  [auth]
    // =========================================================================

    [Authorize]
    [HttpPost("api/resources/{id:guid}/reviews")]
    [ProducesResponseType(StatusCodes.Status201Created)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    [ProducesResponseType(StatusCodes.Status409Conflict)]
    public async Task<IActionResult> PostReview(
        Guid id,
        [FromBody] CreateReviewModel model,
        CancellationToken ct = default)
    {
        if (!ModelState.IsValid)
            return ValidationProblem(ModelState);

        var userId = User.GetUserId();
        var (review, error, status) = await _reviews.CreateReviewAsync(id, userId, model, ct);

        return status switch
        {
            201 => CreatedAtAction(nameof(GetReviews), new { id }, review),
            404 => NotFound(new { error }),
            409 => Conflict(new { error }),
            500 => StatusCode(500, new { error }),
            _   => StatusCode(status, new { error })
        };
    }

    // =========================================================================
    // PATCH /api/resources/{id}/reviews/{reviewId}  [auth, author only]
    // =========================================================================

    [Authorize]
    [HttpPatch("api/resources/{id:guid}/reviews/{reviewId:guid}")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> UpdateReview(
        Guid id,
        Guid reviewId,
        [FromBody] UpdateReviewModel model,
        CancellationToken ct = default)
    {
        if (!ModelState.IsValid)
            return ValidationProblem(ModelState);

        var userId = User.GetUserId();
        var (review, error, status) = await _reviews.UpdateReviewAsync(reviewId, userId, model, ct);

        return status switch
        {
            200 => Ok(review),
            403 => Forbid(),
            404 => NotFound(new { error }),
            500 => StatusCode(500, new { error }),
            _   => StatusCode(status, new { error })
        };
    }

    // =========================================================================
    // DELETE /api/resources/{id}/reviews/{reviewId}  [auth, author or admin]
    // =========================================================================

    [Authorize]
    [HttpDelete("api/resources/{id:guid}/reviews/{reviewId:guid}")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> DeleteReview(
        Guid id,
        Guid reviewId,
        CancellationToken ct = default)
    {
        var userId  = User.GetUserId();
        var isAdmin = User.IsInRole("Admin");

        var (_, error, status) = await _reviews.DeleteReviewAsync(reviewId, userId, isAdmin, ct);

        return status switch
        {
            204 => NoContent(),
            403 => Forbid(),
            404 => NotFound(new { error }),
            500 => StatusCode(500, new { error }),
            _   => StatusCode(status, new { error })
        };
    }

    // =========================================================================
    // POST /api/resources/{id}/reviews/{reviewId}/votes  [auth]
    // Accepts: { "isHelpful": true }
    // Toggle semantics: same vote removes it, opposite flips it.
    // =========================================================================

    [Authorize]
    [HttpPost("api/resources/{id:guid}/reviews/{reviewId:guid}/votes")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> VoteReview(
        Guid id,
        Guid reviewId,
        [FromBody] VoteReviewModel model,
        CancellationToken ct = default)
    {
        var userId = User.GetUserId();
        var (upvotes, downvotes, error, status) = await _reviews.VoteAsync(reviewId, userId, model.IsHelpful, ct);

        return status switch
        {
            200 => Ok(new { reviewId, upvotes, downvotes }),
            404 => NotFound(new { error }),
            _   => StatusCode(status, new { error })
        };
    }

    // =========================================================================
    // DELETE /api/resources/{id}/reviews/{reviewId}/votes  [auth]
    // =========================================================================

    [Authorize]
    [HttpDelete("api/resources/{id:guid}/reviews/{reviewId:guid}/votes")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> DeleteVote(
        Guid id,
        Guid reviewId,
        CancellationToken ct = default)
    {
        var userId = User.GetUserId();
        var (_, error, status) = await _reviews.DeleteVoteAsync(reviewId, userId, ct);

        return status switch
        {
            204 => NoContent(),
            404 => NotFound(new { error }),
            _   => StatusCode(status, new { error })
        };
    }

    // =========================================================================
    // LEGACY ALIASES — kept for Angular frontend backward-compatibility
    // =========================================================================

    /// <summary>
    /// Legacy: POST /api/resource/reviews/{reviewId}/vote?isUpvote=true|false
    /// Replaced by: POST /api/resources/{id}/reviews/{reviewId}/votes
    /// </summary>
    [Authorize]
    [HttpPost("api/resource/reviews/{reviewId:guid}/vote")]
    public async Task<IActionResult> VoteLegacy(
        Guid reviewId,
        [FromQuery] bool isUpvote,
        CancellationToken ct = default)
    {
        var userId = User.GetUserId();
        var (upvotes, downvotes, error, status) = await _reviews.VoteAsync(reviewId, userId, isUpvote, ct);

        return status switch
        {
            200 => Ok(new { reviewId, upvotes, downvotes }),
            404 => NotFound(new { error }),
            _   => StatusCode(status, new { error })
        };
    }

    /// <summary>
    /// Legacy: DELETE /api/resource/reviews/{reviewId}/vote
    /// Replaced by: DELETE /api/resources/{id}/reviews/{reviewId}/votes
    /// </summary>
    [Authorize]
    [HttpDelete("api/resource/reviews/{reviewId:guid}/vote")]
    public async Task<IActionResult> DeleteVoteLegacy(
        Guid reviewId,
        CancellationToken ct = default)
    {
        var userId = User.GetUserId();
        var (_, error, status) = await _reviews.DeleteVoteAsync(reviewId, userId, ct);

        return status switch
        {
            204 => NoContent(),
            404 => NotFound(new { error }),
            _   => StatusCode(status, new { error })
        };
    }

    /// <summary>
    /// Legacy: DELETE /api/resource/{id}/reviews
    /// The old route had no {reviewId} — it deleted the caller's own review for a resource.
    /// Replaced by: DELETE /api/resources/{id}/reviews/{reviewId}
    /// Caller must be authenticated; admins use the new route with an explicit reviewId.
    /// </summary>
    [Authorize]
    [HttpDelete("api/resource/{id:guid}/reviews")]
    public async Task<IActionResult> DeleteReviewLegacy(
        Guid id,
        CancellationToken ct = default)
    {
        var userId = User.GetUserId();

        // Resolve reviewId from resource + current user (legacy callers don't send it)
        var reviewId = await _db.ResourceReviews
            .Where(r => r.ResourceId == id && r.UserId == userId)
            .Select(r => (Guid?)r.Id)
            .FirstOrDefaultAsync(ct);

        if (reviewId is null)
            return NotFound(new { error = "Review not found or you are not the author." });

        var (_, error, status) = await _reviews.DeleteReviewAsync(reviewId.Value, userId, isAdmin: false, ct);

        return status switch
        {
            204 => NoContent(),
            403 => Forbid(),
            404 => NotFound(new { error }),
            500 => StatusCode(500, new { error }),
            _   => StatusCode(status, new { error })
        };
    }
}

/// <summary>Request body for the vote endpoints.</summary>
public class VoteReviewModel
{
    public bool IsHelpful { get; set; }
}
