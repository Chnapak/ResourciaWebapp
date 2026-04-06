import { Component, inject, Input, OnChanges, SimpleChanges } from '@angular/core';
import { Review } from '../../../../../../../../../../shared/models/review';
import { ResourceReviewItemComponent } from './resource-review-item/resource-review-item.component';
import { ButtonComponent } from '../../../../../../../../../../shared/ui/button/button.component';
import { ResourceDetailModel } from '../../../../../../../../../../shared/models/resource-detail';
import { ReviewService } from '../../../../../../../../../../core/services/review.service';

/**
 * Paginated list of reviews for a resource.
 */
@Component({
  selector: 'app-resource-review-list',
  imports: [ResourceReviewItemComponent, ButtonComponent],
  templateUrl: './resource-review-list.component.html',
  styleUrl: './resource-review-list.component.scss',
})
export class ResourceReviewListComponent implements OnChanges {
  /** Resource details (including initial reviews). */
  @Input() resource: ResourceDetailModel | null = null;

  /** Loaded reviews to render. */
  reviews: Review[] = [];
  /** Current pagination page. */
  page = 1;
  /** Page size for review API. */
  pageSize = 10;
  /** Total reviews available. */
  totalItems = 0;

  /** Review API service. */
  private reviewService = inject(ReviewService);

  /** Reload reviews when the resource changes. */
  ngOnChanges(changes: SimpleChanges) {
    if (changes['resource'] && this.resource) {
      this.page = 1;
      this.seedReviewsFromResource();
      this.loadReviews();
    }
  }

  /** Load the first page of reviews with a fallback. */
  loadReviews() {
    if (!this.resource) return;

    const fallbackReviews = this.getFallbackReviews();

    this.reviewService
      .getReviews(this.resource.id, this.page, this.pageSize)
      .subscribe({
        next: (res) => {
          this.page = res.page;
          this.reviews = res.items.length > 0 || fallbackReviews.length === 0
            ? res.items
            : fallbackReviews;
          this.totalItems = res.totalItems > 0 || fallbackReviews.length === 0
            ? res.totalItems
            : fallbackReviews.length;
        },
        error: (err) => {
          console.error('Failed to load reviews', err);
          this.reviews = fallbackReviews;
          this.totalItems = fallbackReviews.length;
        }
      });
  }

  /** Load the next page of reviews and append results. */
  loadMoreReviews(): void {
    if (!this.resource) return;

    if (this.reviews.length >= this.totalItems) return;

    const nextPage = this.page + 1;

    this.reviewService
      .getReviews(this.resource.id, nextPage, this.pageSize)
      .subscribe({
        next: (res) => {
          this.reviews = [...this.reviews, ...res.items];
          this.page = res.page;
          this.totalItems = res.totalItems;
        },
        error: (err) => {
          console.error('Failed to load more reviews', err);
        }
      });
  }

  /** Resource id for child components. */
  get resourceId(): string {
    return this.resource ? this.resource.id : '';
  }

  /** Seed from resource reviews while API loads. */
  private seedReviewsFromResource(): void {
    const fallbackReviews = this.getFallbackReviews();
    this.reviews = fallbackReviews;
    this.totalItems = fallbackReviews.length;
  }

  /** Normalize review data from the resource payload. */
  private getFallbackReviews(): Review[] {
    return (this.resource?.reviews ?? []).map(review => this.normalizeReview(review));
  }

  /** Ensure a review object has all required fields. */
  private normalizeReview(review: Partial<Review>): Review {
    return {
      id: review.id ?? null,
      username: review.username ?? 'Anonymous',
      avatarUrl: review.avatarUrl ?? null,
      createdAt: review.createdAt ?? '',
      rating: review.rating ?? 0,
      content: review.content ?? '',
      upvotes: review.upvotes ?? 0,
      downvotes: review.downvotes ?? 0,
      userVote: review.userVote ?? null,
    };
  }
}
