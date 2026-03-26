import { Component, EventEmitter, OnInit, Output } from '@angular/core';
import { ButtonComponent } from '../../../../../../../../../../shared/ui/button/button.component';
import { AuthService } from '../../../../../../../../../../core/auth/auth.service';
import { TextareaComponent } from '../../../../../../../../../../shared/ui/textarea/textarea.component';
import { FormControl } from '@angular/forms';

@Component({
  selector: 'app-resource-rating-input',
  imports: [ButtonComponent, TextareaComponent],
  templateUrl: './resource-rating-input.component.html',
  styleUrl: './resource-rating-input.component.scss',
})
export class ResourceRatingInputComponent implements OnInit {
  @Output() submit = new EventEmitter<{
    rating: number;
    text: string;
  }>();

  reviewControl = new FormControl('');

  rating = 0;
  hoverRating = 0;
  text = '';

  constructor(private auth: AuthService) {}

  ngOnInit() {
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
    if (!this.auth.requireAuth()) {
      this.auth.setPendingAction({
        type: 'setRating',
        payload: {
          star: i,
          text: this.text
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
    this.submit.emit({ rating: this.rating, text: this.text })
  }
}
