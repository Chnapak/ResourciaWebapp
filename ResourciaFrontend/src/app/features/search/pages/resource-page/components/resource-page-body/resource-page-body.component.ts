import { Component, EventEmitter, Input, Output } from '@angular/core';
import { ResourceDescriptionCardComponent } from './components/resource-description-card/resource-description-card.component';
import { ResourceRatingsComponent } from './components/resource-ratings/resource-ratings.component';
import { ResourceDiscussionSectionComponent } from './components/resource-discussion-section/resource-discussion-section.component';
import { Review } from '../../../../../../shared/models/review';
import { ReviewRequestModel } from '../../../../../../shared/models/review-request';
import { ResourceDetailModel } from '../../../../../../shared/models/resource-detail';

@Component({
  selector: 'app-resource-page-body',
  imports: [ResourceDescriptionCardComponent, ResourceRatingsComponent, ResourceDiscussionSectionComponent],
  templateUrl: './resource-page-body.component.html',
  styleUrl: './resource-page-body.component.scss',
})
export class ResourcePageBodyComponent {
  @Input() resource: ResourceDetailModel | null = null
}
