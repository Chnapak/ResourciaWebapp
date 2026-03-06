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
export class ForgotPasswordPageComponent {
  private readonly fb = inject(FormBuilder);
  private readonly authService = inject(AuthService);

  public isSubmitting = false;
  public emailSent = false;
  public generalError = false;

  protected form = this.fb.nonNullable.group({
    email: ['', [Validators.required, Validators.email]]
  });

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
