/**
 * Page for resetting a password using a tokenized email link.
 */
import { Component, inject } from '@angular/core';
import { TextfieldComponent } from '../../../../shared/ui/textfield/textfield.component';
import { ButtonComponent } from '../../../../shared/ui/button/button.component';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { AuthService } from '../../../../core/auth/auth.service';
import { ResetPasswordModel } from '../../models/reset-password';

@Component({
  selector: 'app-reset-password-page',
  imports: [TextfieldComponent, ButtonComponent, RouterLink, FormsModule, ReactiveFormsModule ],
  templateUrl: './reset-password-page.component.html',
  styleUrl: './reset-password-page.component.scss',
})
/**
 * Collects a new password and submits it with the reset token.
 */
export class ResetPasswordPageComponent {
  /** Form builder for the reset form. */
  private readonly fb = inject(FormBuilder);
  /** Auth service used to submit the reset payload. */
  private readonly authService = inject(AuthService);
  /** Router used for post-reset navigation. */
  private readonly router = inject(Router);
  /** Route used to read the reset token and email. */
  private readonly route = inject(ActivatedRoute);

  /** Whether the reset request is in progress. */
  public isSubmitting = false;

  // UI flags
  /** True when the reset token is missing. */
  public tokenMissing = false;
  /** True when the reset token is invalid or expired. */
  public tokenInvalidOrExpired = false;
  /** True when password and confirmation do not match. */
  public passwordsMismatch = false;
  /** True when a non-specific error occurs. */
  public generalError = false;

  /** Reactive form with password and confirmation controls. */
  protected form = this.fb.nonNullable.group(
    {
      password: ['', [Validators.required, Validators.minLength(8)]],
      confirmPassword: ['', [Validators.required]],
    },
    { validators: [this.passwordsMatchValidator] }
  );

  /** Group-level validator that checks password equality. */
  private passwordsMatchValidator(group: any) {
    const password = group.get('password')?.value;
    const confirmPassword = group.get('confirmPassword')?.value;
    return password && confirmPassword && password !== confirmPassword
      ? { passwordsMismatch: true }
      : null;
  }

  /** Validates input and submits the reset request. */
  onSubmit(): void {
    this.resetFlags();

    // token from URL: /reset-password?token=...
    const token = this.route.snapshot.queryParamMap.get('token');
    const email = this.route.snapshot.queryParamMap.get('email');

    if (!token) {
      this.tokenMissing = true;
      return;
    }

    if (this.form.invalid) {
      this.form.markAllAsTouched();
      this.passwordsMismatch = !!this.form.errors?.['passwordsMismatch'];
      return;
    }

    this.isSubmitting = true;

    const payload: ResetPasswordModel = {
      token,
      newPassword: this.form.controls.password.value,
      email: this.route.snapshot.queryParamMap.get('email') || ''
    };

    console.log('Reset password payload:', payload);

    this.authService.resetPassword(payload).subscribe({
      next: async () => {
        this.isSubmitting = false;
        await this.router.navigate(['/login'], { queryParams: { reset: '1' } });
      },
      error: (err) => {
        console.error('Reset password error:', err);
        this.handleError(err)
      },
    });
  }

  /** Clears all UI error flags. */
  private resetFlags() {
    this.tokenMissing = false;
    this.tokenInvalidOrExpired = false;
    this.passwordsMismatch = false;
    this.generalError = false;
  }

  /** Maps API error codes to UI state. */
  private handleError(error: any) {
    this.isSubmitting = false;

    // Try to mirror your login error shape; tweak as needed
    const body = error?.error;
    const code = body?.error ?? body?.code;

    // common reset-password cases
    if (code === 'RESET_TOKEN_INVALID' || code === 'TOKEN_INVALID') {
      this.tokenInvalidOrExpired = true;
      return;
    }

    if (code === 'RESET_TOKEN_EXPIRED' || code === 'TOKEN_EXPIRED') {
      this.tokenInvalidOrExpired = true;
      return;
    }

    this.generalError = true;
  }
}
