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

@Component({
  selector: 'app-resource-rating-input',
  imports: [ButtonComponent, TextareaComponent, DatePipe],
  templateUrl: './resource-rating-input.component.html',
  styleUrl: './resource-rating-input.component.scss',
})
export class ResourceRatingInputComponent implements OnInit {
  @Output() reviewChange = new EventEmitter<void>();

  reviewControl = new FormControl('');
  id: string | null = null;

  rating = 0;
  hoverRating = 0;
  text: string | null = null;

  submitting = false;
  error: string | null = null;

<<<<<<< HEAD
  constructor(private route: ActivatedRoute, private auth: AuthService, private resource: ResourceService, private router: Router) {}
=======
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
>>>>>>> rescue-mission

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

  private fetchUserReview() {
    this.review.getUserReview(this.id!).subscribe({
      next: (review: Review | null) => {
        this.currentUserReview = review;
        this.showInput = !review;
      },
      error: (err: any) => console.error('Failed to fetch user review', err)
    });
  }

  setRating(i: number) {
    if (!this.auth.isLoggedIn()) {

<<<<<<< HEAD
    // ✅ store action BEFORE redirect
    this.auth.setPendingAction({
      type: 'setRating',
      payload: {
        star: i,
        text: this.text
      }
    });

    // ✅ THIS triggers the guard flow
    this.router.navigate(['/login'], {
      queryParams: {
        returnUrl: this.router.url
      }
    });

    return;
=======
      this.auth.setPendingAction(
        { type: 'setRating', payload: { 
            star: i, 
            text: this.reviewControl.value || ''
          } 
        }
      );

      this.router.navigate(['/login'], { queryParams: { returnUrl: this.router.url } });

      return;
>>>>>>> rescue-mission
    }

    this.rating = i;
  }

  setHover(value: number) {
    this.hoverRating = value;
  }

  clearHover() {
    this.hoverRating = 0;
  }

  get displayRating(): number {
    return this.hoverRating || this.rating;
  }

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
