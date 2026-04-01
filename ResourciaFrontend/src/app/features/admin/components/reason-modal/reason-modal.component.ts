/**
 * Modal form for collecting a moderation reason and optional duration.
 */
import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';

@Component({
  selector: 'app-reason-modal',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule ],
  templateUrl: './reason-modal.component.html',
  styleUrl: './reason-modal.component.scss'
})
/**
 * Displays a reason form for suspend/ban actions and emits confirmation.
 */
export class ReasonModalComponent {
  /** Moderation action type driving labels and duration rules. */
  @Input() type!: 'suspend' | 'ban';
  /** Target user record used for display within the modal. */
  @Input() user!: any;

  /** Emits the reason payload when the moderator confirms. */
  @Output() confirm = new EventEmitter<{ reason: string; durationDays?: number }>();
  /** Emits when the modal should be closed without action. */
  @Output() close = new EventEmitter<void>();

  /** Reactive form backing the reason and duration inputs. */
  form: FormGroup;
  /** Prevents duplicate submissions while processing. */
  isSubmitting = false;

  /** Builds the moderation form with validation rules. */
  constructor(private fb: FormBuilder) {
    this.form = this.fb.group({
      duration: [7],
      reason: ['', [Validators.required, Validators.maxLength(500)]]
    });
  }

  /** True when the action is a suspension (duration is required). */
  get isSuspend() {
    return this.type === 'suspend';
  }

  /** Validates the form and emits the moderation payload. */
  onSubmit() {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.isSubmitting = true;

    const { reason, duration } = this.form.value;

    this.confirm.emit({
      reason,
      durationDays: this.isSuspend ? Number(duration) : undefined
    });

    this.isSubmitting = false;
  }
}
