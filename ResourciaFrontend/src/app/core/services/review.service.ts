import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { Review } from '../../shared/models/review';
import { ReviewRequestModel } from '../../shared/models/review-request';

@Injectable({
  providedIn: 'root',
})
export class ReviewService {
  constructor(private httpClient: HttpClient) { }
  protected readonly baseUrl = '/api/resources';

  /** Get paginated reviews for a resource */
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

  /** Get the current user's review for a resource (null if none) */
  getUserReview(resourceId: string): Observable<Review | null> {
    return this.httpClient.get<Review | null>(`${this.baseUrl}/${resourceId}/reviews/current`);
  }

  /** Submit a review */
  submitReview(resourceId: string, payload: ReviewRequestModel): Observable<void> {
    const body = { content: payload.text, rating: payload.stars };
    return this.httpClient.post<void>(`${this.baseUrl}/${resourceId}/reviews`, body);
  }

  /** Delete a specific review by ID */
  deleteReview(resourceId: string, reviewId: string): Observable<void> {
    return this.httpClient.delete<void>(`${this.baseUrl}/${resourceId}/reviews/${reviewId}`);
  }

  /** Delete the current user's review (optional legacy-friendly) */
  deleteCurrentUserReview(resourceId: string): Observable<void> {
    return this.httpClient.delete<void>(`${this.baseUrl}/${resourceId}/reviews`);
  }

  voteReview(resourceId: string, reviewId: string, isHelpful: boolean) {
    return this.httpClient.post<{ upvotes: number, downvotes: number }>(
      `/api/resources/${resourceId}/reviews/${reviewId}/votes`,
      { isHelpful }
    );
  }
}
