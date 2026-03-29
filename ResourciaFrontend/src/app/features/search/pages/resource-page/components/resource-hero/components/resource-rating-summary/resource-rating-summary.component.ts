import { Component, Input } from '@angular/core';
import { ResourceDetailModel } from '../../../../../../../../shared/models/resource-detail';
import { RatingUtils } from '../../../../../../../../shared/utils/sentiment.utils';

@Component({
  selector: 'app-resource-rating-summary',
  imports: [],
  templateUrl: './resource-rating-summary.component.html',
  styleUrl: './resource-rating-summary.component.scss',
})
export class ResourceRatingSummaryComponent {
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

  get reviewCount(): number {
    return this.resource?.reviews?.length ?? this.totalRatings;
  }

  get rating(): RatingUtils {
    return new RatingUtils(this.resource?.ratings);
  }
}
