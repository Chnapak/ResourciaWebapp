import { Component, Input } from '@angular/core';
import { RatingDistributionItem } from '../../models/rating-distribution-item';
import { CommonModule } from '@angular/common';
import { RatingUtils } from '../../../../../../../../../../shared/utils/sentiment.utils';
import { ResourceDetailModel } from '../../../../../../../../../../shared/models/resource-detail';

/**
 * Overview block showing average rating and distribution.
 */
@Component({
  selector: 'app-resource-rating-overview',
  imports: [CommonModule],
  templateUrl: './resource-rating-overview.component.html',
  styleUrl: './resource-rating-overview.component.scss',
})
export class ResourceRatingOverviewComponent {
  /** Resource details used to build the overview. */
  @Input() resource: ResourceDetailModel | null = null;

  /** Whether there are any ratings yet. */
  get hasRating(): boolean {
    return !!this.resource?.ratings?.totalCount;
  }

  /** Average rating value. */
  get avgScore(): number {
    return this.resource?.ratings?.averageRating ?? 0;
  }

  /** Total count of rating entries. */
  get totalRatings(): number {
    return this.resource?.ratings?.totalCount ?? 0;
  }

  /** Count of written reviews. */
  get reviewCount(): number {
    return this.resource?.reviews?.length ?? this.totalRatings;
  }

  /** Utility for star fills and sentiment labels. */
  get rating(): RatingUtils {
    return new RatingUtils(this.resource?.ratings);
  }
}
