import { Component, EventEmitter, Output } from '@angular/core';
import { ResourceRatingOverviewComponent } from './components/resource-rating-overview/resource-rating-overview.component';
import { ResourceRatingInputComponent } from './components/resource-rating-input/resource-rating-input.component';
import { ResourceReviewListComponent } from './components/resource-review-list/resource-review-list.component';
import { ReviewRequestModel } from '../../../../../../../../shared/models/review-request';

@Component({
  selector: 'app-resource-ratings',
  imports: [ResourceRatingOverviewComponent, ResourceRatingInputComponent,ResourceReviewListComponent],
  templateUrl: './resource-ratings.component.html',
  styleUrl: './resource-ratings.component.scss',
})
export class ResourceRatingsComponent {
  
}
