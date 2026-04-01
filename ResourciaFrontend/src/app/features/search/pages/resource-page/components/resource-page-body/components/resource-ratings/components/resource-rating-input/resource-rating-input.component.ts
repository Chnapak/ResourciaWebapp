import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { ButtonComponent } from '../../../../../../../../../../shared/ui/button/button.component';
import { AuthService } from '../../../../../../../../../../core/auth/auth.service';
import { TextareaComponent } from '../../../../../../../../../../shared/ui/textarea/textarea.component';
import { FormControl } from '@angular/forms';
import { ReviewRequestModel } from '../../../../../../../../../../shared/models/review-request';
import { ActivatedRoute, Router } from '@angular/router';
import { ResourceService } from '../../../../../../../../../../core/services/resource.service';
import { Review } from '../../../../../../../../../../shared/models/review';
import { DatePipe } from '@angular/common';
import { ReviewService } from '../../../../../../../../../../core/services/review.service';

/**
 * Rating input widget for submitting a review on a resource.
 */
@Component({
  selector: 'app-resource-rating-input',
  imports: [ButtonComponent, TextareaComponent, DatePipe],
  templateUrl: './resource-rating-input.component.html',
  styleUrl: './resource-rating-input.component.scss',
})
export class ResourceRatingInputComponent implements OnInit {
  /** Notify parent when a review is created/updated/deleted. */
  @Output() reviewChange = new EventEmitter<void>();

  /** Review text form control. */
  reviewControl = new FormControl('');
  /** Current resource id from route. */
  id: string | null = null;

  /** Selected star rating (1-5). */
  rating = 0;
  /** Hover state for star selection. */
  hoverRating = 0;
  /** Cached text during submission. */
  text: string | null = null;

  /** Submission state flag. */
  submitting = false;
  /** Error message for submission failures. */
  error: string | null = null;

  /** Injected dependencies (see conflict resolution below). */
  currentUserReview: Review | null = null;
  currentUser: string | null = null;

  showInput: boolean = true;
  deleting: boolean = false;

  constructor(
    private route: ActivatedRoute,
    private auth: AuthService,
    private review: ReviewService,
    private router: Router
  ) {}

  /** Initialize resource id and restore any pending action. */
  ngOnInit() {
    this.id = this.route.snapshot.paramMap.get('id');

    if (!this.id) return;

    if (!this.auth.isLoggedIn()) {
      return;
    }

    this.fetchUserReview();

    const action = this.auth.peekPendingAction();
    if (action && action.type === 'setRating') {
      this.auth.runPendingAction();
      this.rating = action.payload.star;
      this.reviewControl.setValue(action.payload.text || '');
      console.log('Running pending action with payload:', action.payload);
    }
  }

  /** Load the current user's existing review (if any). */
  private fetchUserReview() {
    this.review.getUserReview(this.id!).subscribe({
      next: (review: Review | null) => {
        this.currentUserReview = review;
        this.showInput = !review;
      },
      error: (err: any) => console.error('Failed to fetch user review', err)
    });
  }

  /** Set a star rating, redirecting to login if required. */
  setRating(i: number) {
    if (!this.auth.isLoggedIn()) {

      this.auth.setPendingAction(
        { type: 'setRating', payload: { 
            star: i, 
            text: this.reviewControl.value || ''
          } 
        }
      );

      this.router.navigate(['/login'], { queryParams: { returnUrl: this.router.url } });

      return;
    }

    this.rating = i;
  }

  /** Update hover state for star rating. */
  setHover(value: number) {
    this.hoverRating = value;
  }

  /** Clear hover state for star rating. */
  clearHover() {
    this.hoverRating = 0;
  }

  /** Rating displayed in the UI (hover takes precedence). */
  get displayRating(): number {
    return this.hoverRating || this.rating;
  }

  /** Submit the review or redirect to login if required. */
  submitReview() {
    if (!this.auth.requireAuth()) 
    {
      this.auth.setPendingAction(
        { type: 'setRating', payload: { 
            star: this.rating, 
            text: this.reviewControl.value || ''
          } 
        }
      );

      this.router.navigate(['/login'], { queryParams: { returnUrl: this.router.url } });

      return;
    }

    this.doSubmit();
  }

  /** Delete the user's review if it exists. */
  requestDeleteReview() {
    if (!this.currentUserReview || !this.currentUserReview.id) return;

    this.deleting = true;
    this.review.deleteReview(this.id!, this.currentUserReview.id).subscribe({
      next: () => {
        this.showInput = true; // show input again
        this.currentUserReview = null;
        this.reviewControl.reset();
        this.rating = 0;
        this.deleting = false;
        this.reviewChange.emit(); // Notify parent to refresh reviews
      },
      error: (err) => {
        console.error(err);
        this.error = "Failed to delete review.";
        this.deleting = false;
      }
    });
  }

  /** Build the request payload and submit the review. */
  private doSubmit() {
    this.text = this.reviewControl.value || '';

    if (!this.id) {
      this.error = 'Resource ID not found.';
      return;
    }

    this.submitting = true;
    this.error = null;

    const request: ReviewRequestModel = {
      stars: this.rating,
      text: this.text
    };

    this.review.submitReview(this.id, request).subscribe({
      next: () => {                          // <-- void, no res parameter
        this.submitting = false;
        this.fetchUserReview();
        this.reviewChange.emit(); // Notify parent to refresh reviews
      },
      error: (err: any) => {
        this.submitting = false;
        this.error = 'Failed to submit review.';
        console.error('Review submission error', err);
      }
    });

  }
}
