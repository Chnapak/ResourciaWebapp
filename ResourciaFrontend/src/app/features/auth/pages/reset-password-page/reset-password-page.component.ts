import { Component, inject } from '@angular/core';
import { TextfieldComponent } from '../../../../shared/ui/textfield/textfield.component';
import { ButtonComponent } from '../../../../shared/ui/button/button.component';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { AuthService } from '../../../../core/auth/auth.service';

@Component({
  selector: 'app-reset-password-page',
  imports: [TextfieldComponent, ButtonComponent, RouterLink, FormsModule, ReactiveFormsModule ],
  templateUrl: './reset-password-page.component.html',
  styleUrl: './reset-password-page.component.scss',
})
export class ResetPasswordPageComponent {
  private readonly fb = inject(FormBuilder);
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);

  public isSubmitting = false;

  // UI flags
  public tokenMissing = false;
  public tokenInvalidOrExpired = false;
  public passwordsMismatch = false;
  public generalError = false;

  // ✅ Form
  protected form = this.fb.nonNullable.group(
    {
      password: ['', [Validators.required, Validators.minLength(8)]],
      confirmPassword: ['', [Validators.required]],
    },
    { validators: [this.passwordsMatchValidator] }
  );

  // ---- Custom validator (group-level)
  private passwordsMatchValidator(group: any) {
    const password = group.get('password')?.value;
    const confirmPassword = group.get('confirmPassword')?.value;
    return password && confirmPassword && password !== confirmPassword
      ? { passwordsMismatch: true }
      : null;
  }

  onSubmit(): void {
    this.resetFlags();

    // token from URL: /reset-password?token=...
    const token = this.route.snapshot.queryParamMap.get('token');

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

    const payload = {
      token,
      newPassword: this.form.controls.password.value,
    };
    console.log('Reset password payload:', payload);

    // Adjust to your API method name / DTO
    /*this.authService.resetPassword(payload).subscribe({
      next: async () => {
        this.isSubmitting = false;
        await this.router.navigate(['/login'], { queryParams: { reset: '1' } });
      },
      error: (err) => this.handleError(err),
    });*/
  }

  private resetFlags() {
    this.tokenMissing = false;
    this.tokenInvalidOrExpired = false;
    this.passwordsMismatch = false;
    this.generalError = false;
  }

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
