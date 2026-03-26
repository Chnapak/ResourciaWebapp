import { Component, Input } from '@angular/core';
import { Review } from '../../../../../../../../../../shared/models/review';
import { ResourceReviewItemComponent } from './resource-review-item/resource-review-item.component';
import { ButtonComponent } from '../../../../../../../../../../shared/ui/button/button.component';

@Component({
  selector: 'app-resource-review-list',
  imports: [ResourceReviewItemComponent, ButtonComponent],
  templateUrl: './resource-review-list.component.html',
  styleUrl: './resource-review-list.component.scss',
})
export class ResourceReviewListComponent {
  @Input() reviews: Review[] = [];

  loadMoreReviews() {
    console.log("this is bullshit")
  }
}
