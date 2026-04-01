/**
 * Full-page login view with Turnstile captcha.
 */
import { Component, inject } from '@angular/core';
import { FormBuilder, FormControl, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { AuthService } from '../../../../core/auth/auth.service';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { environment } from '../../../../../environments/environment.development';
import { TextfieldComponent } from '../../../../shared/ui/textfield/textfield.component';
import { ButtonComponent } from '../../../../shared/ui/button/button.component';

declare var turnstile: any;

@Component({
  selector: 'app-login-page',
  standalone: true,
  imports: [ TextfieldComponent, ButtonComponent, FormsModule, ReactiveFormsModule, RouterLink ],
  templateUrl: './login-page.component.html',
  styleUrl: './login-page.component.scss'
})
/**
 * Collects credentials and navigates to the return URL on success.
 */
export class LoginPageComponent {
  /** Form builder for the login form. */
  private readonly fb = inject(FormBuilder);
  /** Auth service used to perform login requests. */
  private readonly authService = inject(AuthService);
  /** Router used to navigate after login or suspension. */
  private readonly router = inject(Router);
  /** Activated route used to read returnUrl. */
  private readonly route = inject(ActivatedRoute);
  
  /** Turnstile site key for captcha rendering. */
  public readonly siteKey = environment.siteKey;
  
  /** Whether a login request is in progress. */
  public isSubmitting = false;
  /** True when credentials are invalid. */
  public loginFailed = false;
  /** True when a non-specific error occurs. */
  public generalError = false;
  /** True when captcha is missing or invalid. */
  public captchaFailed = false;

  /** Reactive form with email and password validators. */
  protected form = this.fb.nonNullable.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required]]
  });
  
  /** Renders the Turnstile widget after the view initializes. */
  ngAfterViewInit() {
    this.renderTurnstile();
  }

  /** Mounts the Turnstile widget and captures tokens. */
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

  /** Validates input and submits the login request. */
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
        const returnUrl = this.route.snapshot.queryParams['returnUrl'] || '/';

        this.router.navigateByUrl(returnUrl);
      },
      error: (error) => {
        this.handleError(error);
      }
    });
  }

  /** Maps API errors to UI state and handles suspended users. */
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
