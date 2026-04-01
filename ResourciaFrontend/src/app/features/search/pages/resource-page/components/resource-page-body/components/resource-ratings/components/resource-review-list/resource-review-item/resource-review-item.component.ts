import { Component, Input } from '@angular/core';
import { Review } from '../../../../../../../../../../../shared/models/review';
import { getInitials, getUserGradient } from '../../../../../../../../../../../shared/utils/user.utils';
import { CommonModule, DatePipe } from '@angular/common';
import { ReviewService } from '../../../../../../../../../../../core/services/review.service';
import { RouterLink } from '@angular/router';

/**
 * Single review item with voting controls.
 */
@Component({
  selector: 'app-resource-review-item',
  imports: [DatePipe, CommonModule, RouterLink],
  templateUrl: './resource-review-item.component.html',
  styleUrl: './resource-review-item.component.scss',
})
export class ResourceReviewItemComponent {
  /** Review data to render. */
  @Input() review!: Review
  /** Resource id for vote API calls. */
  @Input() resourceId!: string;

  /** Guard to prevent multiple vote requests. */
  voting = false;

  /** Review API service for voting. */
  constructor(private reviewService: ReviewService) {}

  /** Avatar initials for the reviewer. */
  get initials(): string {
    return this.review ? getInitials(this.review.username) : '';
  }

  /** Avatar gradient for the reviewer. */
  get gradient(): string {
    return this.review ? getUserGradient(this.review.username) : '';
  }

  /** Router link to the reviewer's profile. */
  get profileLink(): string[] {
    return ['/profile', this.review.username];
  }
  
  /** Vote a review up or down (toggles if repeated). */
  vote(isHelpful: boolean) {
    console.log('vote called', isHelpful, 'current userVote', this.review.userVote);
    if (this.voting) return;
    this.voting = true;

    this.reviewService.voteReview(this.resourceId, this.review.id!, isHelpful).subscribe({
      next: (res) => {
        const toggled = this.review.userVote === isHelpful; // same vote = toggle off
        this.review = {
          ...this.review,
          upvotes: res.upvotes,
          downvotes: res.downvotes,
          userVote: toggled ? null : isHelpful
        };
        this.voting = false;
        console.log('Vote successful. Updated review:', this.review);
      },
      error: () => this.voting = false
    });
  }
}
