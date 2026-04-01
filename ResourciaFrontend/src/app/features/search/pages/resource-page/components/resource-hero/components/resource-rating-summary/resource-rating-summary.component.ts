import { Component, Input } from '@angular/core';
import { ResourceDetailModel } from '../../../../../../../../shared/models/resource-detail';
import { RatingUtils } from '../../../../../../../../shared/utils/sentiment.utils';

/**
 * Rating summary pill shown in the resource hero.
 */
@Component({
  selector: 'app-resource-rating-summary',
  imports: [],
  templateUrl: './resource-rating-summary.component.html',
  styleUrl: './resource-rating-summary.component.scss',
})
export class ResourceRatingSummaryComponent {
  /** Resource data used for rating aggregates. */
  @Input() resource: ResourceDetailModel | null = null;

  /** Whether the resource has any ratings. */
  get hasRating(): boolean {
    return !!this.resource?.ratings?.totalCount;
  }

  /** Average rating score. */
  get avgScore(): number {
    return this.resource?.ratings?.averageRating ?? 0;
  }

  /** Total number of rating entries. */
  get totalRatings(): number {
    return this.resource?.ratings?.totalCount ?? 0;
  }

  /** Review count (fallback to rating total). */
  get reviewCount(): number {
    return this.resource?.reviews?.length ?? this.totalRatings;
  }

  /** Utility for rendering sentiment/rating UI. */
  get rating(): RatingUtils {
    return new RatingUtils(this.resource?.ratings);
  }
}
