import { Component, inject, Input, OnChanges, SimpleChanges } from '@angular/core';
import { Review } from '../../../../../../../../../../shared/models/review';
import { ResourceReviewItemComponent } from './resource-review-item/resource-review-item.component';
import { ButtonComponent } from '../../../../../../../../../../shared/ui/button/button.component';
import { ResourceDetailModel } from '../../../../../../../../../../shared/models/resource-detail';
import { ReviewService } from '../../../../../../../../../../core/services/review.service';

@Component({
  selector: 'app-resource-review-list',
  imports: [ResourceReviewItemComponent, ButtonComponent],
  templateUrl: './resource-review-list.component.html',
  styleUrl: './resource-review-list.component.scss',
})
export class ResourceReviewListComponent implements OnChanges {
  @Input() resource: ResourceDetailModel | null = null;

  reviews: Review[] = [];
  page = 1;
  pageSize = 10;
  totalItems = 0;

  private reviewService = inject(ReviewService);

  ngOnChanges(changes: SimpleChanges) {
    if (changes['resource'] && this.resource) {
      this.page = 1;
      this.seedReviewsFromResource();
      this.loadReviews();
    }
  }

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

  get resourceId(): string {
    return this.resource ? this.resource.id : '';
  }

  private seedReviewsFromResource(): void {
    const fallbackReviews = this.getFallbackReviews();
    this.reviews = fallbackReviews;
    this.totalItems = fallbackReviews.length;
  }

  private getFallbackReviews(): Review[] {
    return (this.resource?.reviews ?? []).map(review => this.normalizeReview(review));
  }

  private normalizeReview(review: Partial<Review>): Review {
    return {
      id: review.id ?? null,
      username: review.username ?? 'Anonymous',
      createdAt: review.createdAt ?? '',
      rating: review.rating ?? 0,
      content: review.content ?? '',
      upvotes: review.upvotes ?? 0,
      downvotes: review.downvotes ?? 0,
      userVote: review.userVote ?? null,
    };
  }
}
