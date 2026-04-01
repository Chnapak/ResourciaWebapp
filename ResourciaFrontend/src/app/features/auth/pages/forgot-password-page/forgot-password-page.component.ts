/**
 * Page that initiates the password reset email flow.
 */
import { Component, inject } from '@angular/core';
import { FormBuilder, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { AuthService } from '../../../../core/auth/auth.service';
import { TextfieldComponent } from '../../../../shared/ui/textfield/textfield.component';
import { ButtonComponent } from '../../../../shared/ui/button/button.component';
import { Router, RouterLink } from '@angular/router';

@Component({
  selector: 'app-forgot-password-page',
  imports: [TextfieldComponent, ButtonComponent, FormsModule, ReactiveFormsModule, RouterLink],
  templateUrl: './forgot-password-page.component.html',
  styleUrl: './forgot-password-page.component.scss',
})
/**
 * Collects the user's email and triggers a reset email.
 */
export class ForgotPasswordPageComponent {
  /** Form builder for the email input form. */
  private readonly fb = inject(FormBuilder);
  /** Auth service used to request password resets. */
  private readonly authService = inject(AuthService);

  /** Whether the request is in progress. */
  public isSubmitting = false;
  /** True once the reset email is sent. */
  public emailSent = false;
  /** True when a non-specific error occurs. */
  public generalError = false;

  /** Reactive form with email validation. */
  protected form = this.fb.nonNullable.group({
    email: ['', [Validators.required, Validators.email]]
  });

  /** Validates the form and requests a reset email. */
  onSubmit(): void {
    this.emailSent = false;
    this.generalError = false;

    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.isSubmitting = true;

    this.authService.forgotPassword(this.form.getRawValue()).subscribe({
      next: () => {
        this.isSubmitting = false;
        this.emailSent = true;
      },
      error: () => {
        this.isSubmitting = false;
        this.generalError = true;
      }
    });
  }
}
