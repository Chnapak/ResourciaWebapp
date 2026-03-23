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
export class ReasonModalComponent {
  @Input() type!: 'suspend' | 'ban';
  @Input() user!: any;

  @Output() confirm = new EventEmitter<{ reason: string; durationDays?: number }>();
  @Output() close = new EventEmitter<void>();

  form: FormGroup;
  isSubmitting = false;

  constructor(private fb: FormBuilder) {
    this.form = this.fb.group({
      duration: [7],
      reason: ['', [Validators.required, Validators.maxLength(500)]]
    });
  }

  get isSuspend() {
    return this.type === 'suspend';
  }

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
