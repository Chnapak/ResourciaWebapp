import { Component, Input, OnInit } from '@angular/core';
import { Review } from '../../../../../../../../../../../shared/models/review';
import { getInitials, getUserGradient } from '../../../../../../../../../../../shared/utils/user.utils';
import { CommonModule, DatePipe } from '@angular/common';
import { ReviewService } from '../../../../../../../../../../../core/services/review.service';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../../../../../../../../../../core/auth/auth.service';

/**
 * Single review item with voting controls.
 */
@Component({
  selector: 'app-resource-review-item',
  imports: [DatePipe, CommonModule, RouterLink],
  templateUrl: './resource-review-item.component.html',
  styleUrl: './resource-review-item.component.scss',
})
export class ResourceReviewItemComponent implements OnInit {
  @Input() review!: Review;
  @Input() resourceId!: string;

  voting = false;

  constructor(
    private reviewService: ReviewService,
    private auth: AuthService,
    private router: Router
  ) {}

  ngOnInit(): void {
    const action = this.auth.peekPendingAction();
    if (action?.type === 'voteReview' && action.payload.reviewId === this.review.id) {
      this.auth.runPendingAction();
      this.doVote(action.payload.isHelpful);
    }
  }

  get initials(): string {
    return this.review ? getInitials(this.review.username) : '';
  }

  get gradient(): string {
    return this.review ? getUserGradient(this.review.username) : '';
  }

  get profileLink(): string[] {
    return ['/profile', this.review.username];
  }

  vote(isHelpful: boolean) {
    if (this.voting) return;

    if (!this.auth.isLoggedIn()) {
      this.auth.setPendingAction({
        type: 'voteReview',
        payload: { resourceId: this.resourceId, reviewId: this.review.id!, isHelpful }
      });
      this.router.navigate(['/login'], { queryParams: { returnUrl: this.router.url } });
      return;
    }

    this.doVote(isHelpful);
  }

  private doVote(isHelpful: boolean) {
    this.voting = true;
    this.reviewService.voteReview(this.resourceId, this.review.id!, isHelpful).subscribe({
      next: (res) => {
        const toggled = this.review.userVote === isHelpful;
        this.review = {
          ...this.review,
          upvotes: res.upvotes,
          downvotes: res.downvotes,
          userVote: toggled ? null : isHelpful
        };
        this.voting = false;
      },
      error: () => this.voting = false
    });
  }
}
