import { Component, Input } from '@angular/core';
import { Review } from '../../../../../../../../../../../shared/models/review';
import { getInitials, getUserGradient } from '../../../../../../../../../../../shared/utils/user.utils';


@Component({
  selector: 'app-resource-review-item',
  standalone:true,
  imports: [],
  templateUrl: './resource-review-item.component.html',
  styleUrl: './resource-review-item.component.scss',
})
export class ResourceReviewItemComponent {
  @Input() review!: Review;
  get initials(): string {
    return this.review ? getInitials(this.review.username) : '';
  }

  get gradient(): string {
    return this.review ? getUserGradient(this.review.username) : '';
  }
}
