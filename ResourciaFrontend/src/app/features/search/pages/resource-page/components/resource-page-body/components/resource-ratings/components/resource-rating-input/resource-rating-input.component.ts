import { Component, EventEmitter, OnInit, Output } from '@angular/core';
import { ButtonComponent } from '../../../../../../../../../../shared/ui/button/button.component';
import { AuthService } from '../../../../../../../../../../core/auth/auth.service';
import { TextareaComponent } from '../../../../../../../../../../shared/ui/textarea/textarea.component';
import { FormControl } from '@angular/forms';
import { ReviewRequestModel } from '../../../../../../../../../../shared/models/review-request';
import { ActivatedRoute, Router } from '@angular/router';
import { ResourceService } from '../../../../../../../../../../core/services/resource.service';

@Component({
  selector: 'app-resource-rating-input',
  imports: [ButtonComponent, TextareaComponent],
  templateUrl: './resource-rating-input.component.html',
  styleUrl: './resource-rating-input.component.scss',
})
export class ResourceRatingInputComponent implements OnInit {

  reviewControl = new FormControl('');

  id: string | null = null;

  rating = 0;
  hoverRating = 0;
  text: string | null = null;

  submitting = false;
  error: string | null = null;

  constructor(private route: ActivatedRoute, private auth: AuthService, private resource: ResourceService, private router: Router) {}

  ngOnInit() {
    this.id = this.route.snapshot.paramMap.get('id');
    const action = this.auth.runPendingAction();

    if (!action) return;

    switch (action.type) {
      case 'setRating':
        this.rating = action.payload.star;
        this.text = action.payload.text;
        break;

      case 'submitReview':
        this.doSubmit();
        break;
    }
  }

  setRating(i: number) {
    if (!this.auth.isLoggedIn()) {

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
    if (!this.auth.requireAuth()) {
      this.auth.setPendingAction({
        type: 'setRating',
        payload: {
          star: this.rating,
          text: this.text
        }
      });
      return;
    }

    this.doSubmit();
  }
  
  private doSubmit() {
    this.text = this.reviewControl.value;

    if (!this.text) {
      this.text = ""
    }

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

    this.resource.submitReview(this.id, request).subscribe({
      next: (res) => {
        this.submitting = false;
        this.rating = 0;
        this.text = '';
        this.reviewControl.reset('');
        console.log('Review submitted successfully', res);
      },
      error: (err) => {
        this.submitting = false;
        this.error = 'Failed to submit review.';
        console.error('Review submission error', err);
      }
    });
  }
}
