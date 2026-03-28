import { Component, Input } from '@angular/core';
import { Review } from '../../../../../../../../../../../shared/models/review';
import { getInitials, getUserGradient } from '../../../../../../../../../../../shared/utils/user.utils';
import { DatePipe } from '@angular/common';

@Component({
  selector: 'app-resource-review-item',
  imports: [DatePipe],
  templateUrl: './resource-review-item.component.html',
  styleUrl: './resource-review-item.component.scss',
})
export class ResourceReviewItemComponent {
  @Input() review!: Review

  get initials(): string {
    return this.review ? getInitials(this.review.username) : '';
  }

  get gradient(): string {
    return this.review ? getUserGradient(this.review.username) : '';
  }
}
