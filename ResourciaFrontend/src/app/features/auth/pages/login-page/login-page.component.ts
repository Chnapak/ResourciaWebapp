import { Component, inject } from '@angular/core';
import { FormBuilder, FormControl, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { AuthService } from '../../../../core/auth/auth.service';
import { Router } from '@angular/router';
import { environment } from '../../../../../environments/environment.development';
import { TextfieldComponent } from '../../../../shared/ui/textfield/textfield.component';
import { ButtonComponent } from '../../../../shared/ui/button/button.component';

declare var turnstile: any;

@Component({
  selector: 'app-login-page',
  standalone: true,
  imports: [ TextfieldComponent, ButtonComponent, FormsModule, ReactiveFormsModule ],
  templateUrl: './login-page.component.html',
  styleUrl: './login-page.component.scss'
})
export class LoginPageComponent {
  private readonly fb = inject(FormBuilder);
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);
  
  public readonly siteKey = environment.siteKey;
  
  public isSubmitting = false;
  public loginFailed = false;
  public generalError = false;
  public captchaFailed = false;

  // Form definition with Validators
  protected form = this.fb.nonNullable.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required]]
  });

  ngAfterViewInit() {
    this.renderTurnstile();
  }

  private renderTurnstile() {
    if (typeof turnstile !== 'undefined') {
      turnstile.render('#turnstile-container', {
        sitekey: this.siteKey,
        theme: 'light',
        callback: (token: string) => {
          this.captchaFailed = false;
        }
      });
    }
  }

  onSubmit(): void {
    this.loginFailed = false;
    this.generalError = false;
    this.captchaFailed = false;

    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const token = turnstile.getResponse();
    if (!token) {
      this.captchaFailed = true;
      return;
    }

    this.isSubmitting = true;
    const data = { ...this.form.getRawValue(), captchaToken: token };

    this.authService.login(data).subscribe({
      next: async () => {
        await this.router.navigate(['/']);
      },
      error: (error) => {
        this.handleError(error);
      }
    });
  }

  private handleError(error: any) {
    this.isSubmitting = false;
    const errorCode = error?.error;
    const validationErrors = errorCode?.errors;

    if (errorCode?.error === 'USER_LOCKED_OUT') {
      this.router.navigate(['/suspended'], {
        state: {
          reason: errorCode.reason,
          type: 'Temporary',
          restoreDate: errorCode.until,
          caseId: 'RSC-20260226-4471'
        }
      });
      return;
    }

    if (validationErrors?.Email?.includes('LOGIN_FAILED')) {
      this.loginFailed = true;
    } else {
      this.generalError = true;
    }

    turnstile.reset('#turnstile-container');
  }
}
