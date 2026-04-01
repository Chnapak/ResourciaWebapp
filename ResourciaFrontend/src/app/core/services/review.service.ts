/**
 * API client for resource reviews and voting.
 */
import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { Review } from '../../shared/models/review';
import { ReviewRequestModel } from '../../shared/models/review-request';

/**
 * Service wrapper for review-related endpoints.
 */
@Injectable({
  providedIn: 'root',
})
export class ReviewService {
  /** Creates the review service with HTTP access. */
  constructor(private httpClient: HttpClient) { }
  /** Base API path for resource review endpoints. */
  protected readonly baseUrl = '/api/resources';

  /** Retrieves paginated reviews for a resource. */
  getReviews(
    resourceId: string,
    page = 1,
    pageSize = 10,
    sortBy = 'helpful'
  ): Observable<{ items: Review[]; totalItems: number; page: number; pageSize: number }> {
    return this.httpClient.get<any>(`${this.baseUrl}/${resourceId}/reviews`, {
      params: { page, pageSize, sortBy }
    });
  }

  /** Fetches the current user's review for a resource (null if none). */
  getUserReview(resourceId: string): Observable<Review | null> {
    return this.httpClient.get<Review | null>(`${this.baseUrl}/${resourceId}/reviews/current`);
  }

  /** Submits a review for a resource. */
  submitReview(resourceId: string, payload: ReviewRequestModel): Observable<void> {
    const body = { content: payload.text, rating: payload.stars };
    return this.httpClient.post<void>(`${this.baseUrl}/${resourceId}/reviews`, body);
  }

  /** Deletes a specific review by id. */
  deleteReview(resourceId: string, reviewId: string): Observable<void> {
    return this.httpClient.delete<void>(`${this.baseUrl}/${resourceId}/reviews/${reviewId}`);
  }

  /** Deletes the current user's review for a resource. */
  deleteCurrentUserReview(resourceId: string): Observable<void> {
    return this.httpClient.delete<void>(`${this.baseUrl}/${resourceId}/reviews`);
  }

  /** Votes a review as helpful or not helpful. */
  voteReview(resourceId: string, reviewId: string, isHelpful: boolean) {
    return this.httpClient.post<{ upvotes: number, downvotes: number }>(
      `/api/resources/${resourceId}/reviews/${reviewId}/votes`,
      { isHelpful }
    );
  }
}
