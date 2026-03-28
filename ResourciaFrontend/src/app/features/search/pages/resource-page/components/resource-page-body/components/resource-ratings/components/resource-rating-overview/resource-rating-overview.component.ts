import { Component, Input } from '@angular/core';
import { RatingDistributionItem } from '../../models/rating-distribution-item';
import { CommonModule } from '@angular/common';
import { RatingUtils } from '../../../../../../../../../../shared/utils/sentiment.utils';
import { ResourceDetailModel } from '../../../../../../../../../../shared/models/resource-detail';

@Component({
  selector: 'app-resource-rating-overview',
  imports: [CommonModule],
  templateUrl: './resource-rating-overview.component.html',
  styleUrl: './resource-rating-overview.component.scss',
})
export class ResourceRatingOverviewComponent {
  @Input() resource: ResourceDetailModel | null = null;

  get hasRating(): boolean {
    return !!this.resource?.ratings?.totalCount;
  }

  get avgScore(): number {
    return this.resource?.ratings?.averageRating ?? 0;
  }

  get totalRatings(): number {
    return this.resource?.ratings?.totalCount ?? 0;
  }

  get rating(): RatingUtils {
    return new RatingUtils(this.resource?.ratings);
  }
}
