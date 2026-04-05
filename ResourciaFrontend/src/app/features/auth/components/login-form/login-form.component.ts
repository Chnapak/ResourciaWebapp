/**
 * Login form component with Turnstile captcha integration.
 */
import {
  AfterViewInit,
  Component,
  EventEmitter,
  inject,
  Input,
  OnDestroy,
  Output,
} from '@angular/core';
import {
  FormBuilder,
  FormsModule,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../../../core/auth/auth.service';
import { TextfieldComponent } from '../../../../shared/ui/textfield/textfield.component';
import { ButtonComponent } from '../../../../shared/ui/button/button.component';
import { environment } from '../../../../../environments/environment';

declare var turnstile: any;

@Component({
  selector: 'app-login-form',
  standalone: true,
  imports: [TextfieldComponent, ButtonComponent, FormsModule, ReactiveFormsModule, RouterLink],
  templateUrl: './login-form.component.html',
})
/**
 * Collects credentials, validates captcha, and initiates login.
 */
export class LoginFormComponent implements AfterViewInit, OnDestroy {
  /** When true, adjusts layout for use inside the auth modal */
  @Input() isModal = false;
  /** Unique suffix so multiple instances don't clash */
  @Input() instanceId = 'login';

  /** Emitted on successful login so parent can close modal / navigate */
  @Output() loginSuccess = new EventEmitter<void>();

  /** Form builder for reactive form creation. */
  private readonly fb = inject(FormBuilder);
  /** Router used for suspended-user redirects. */
  private readonly router = inject(Router);
  /** Auth service used to perform login requests. */
  readonly authService = inject(AuthService);

  /** Turnstile site key for captcha rendering. */
  readonly siteKey = environment.siteKey;

  /** Whether a login request is in progress. */
  isSubmitting = false;
  /** True when login credentials are rejected. */
  loginFailed = false;
  /** True when the email address is unconfirmed. */
  emailNotConfirmed = false;
  /** True when a non-specific error occurs. */
  generalError = false;
  /** True when captcha is missing or invalid. */
  captchaFailed = false;
  /** Captcha token returned by Turnstile. */
  captchaToken: string | null = null;

  /** Reactive login form with email and password controls. */
  readonly form = this.fb.nonNullable.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required]],
  });

  /** Unique element id used for the Turnstile container. */
  get turnstileContainerId(): string {
    return `turnstile-login-${this.instanceId}`;
  }

  /** Renders the Turnstile widget after the view initializes. */
  ngAfterViewInit(): void {
    this.renderTurnstile();
  }

  /** Cleans up the Turnstile widget on destroy. */
  ngOnDestroy(): void {
    if (typeof turnstile !== 'undefined') {
      try { turnstile.remove(`#${this.turnstileContainerId}`); } catch { /* ignore */ }
    }
  }

  /** Renders the Turnstile widget and wires callbacks. */
  private renderTurnstile(): void {
    if (typeof turnstile === 'undefined') return;
    turnstile.render(`#${this.turnstileContainerId}`, {
      sitekey: this.siteKey,
      theme: 'light',
      appearance: this.isModal ? 'interaction-only' : 'always',
      callback: (token: string) => {
        this.captchaToken = token;
        this.captchaFailed = false;
      },
      'expired-callback': () => {
        this.captchaToken = null;
      },
    });
  }

  /** Disables submit while loading or without a captcha token. */
  get isSubmitDisabled(): boolean {
    return this.isSubmitting || !this.captchaToken;
  }

  /** Validates input and submits the login request. */
  onSubmit(): void {
    this.loginFailed = false;
    this.emailNotConfirmed = false;
    this.generalError = false;
    this.captchaFailed = false;

    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    if (!this.captchaToken) {
      this.captchaFailed = true;
      return;
    }

    this.isSubmitting = true;
    const data = { ...this.form.getRawValue(), captchaToken: this.captchaToken };

    this.authService.login(data).subscribe({
      next: () => {
        this.isSubmitting = false;
        this.loginSuccess.emit();
      },
      error: (error) => this.handleError(error),
    });
  }

  /** Resends the email confirmation link using the current email. */
  resendConfirmation(): void {
    const email = this.form.get('email')?.value;
    if (!email) return;
    this.authService.resendEmail({ email }).subscribe();
  }

  /** Maps API errors to UI state and handles suspended users. */
  private handleError(error: any): void {
    this.isSubmitting = false;
    const errorCode = error?.error;
    const validationErrors = errorCode?.errors;

    if (errorCode?.error === 'USER_LOCKED_OUT') {
      this.router.navigate(['/suspended'], {
        state: {
          reason: errorCode.reason,
          type: 'Temporary',
          restoreDate: errorCode.until,
        },
      });
      return;
    }

    if (errorCode?.error === 'EMAIL_NOT_CONFIRMED' ||
        validationErrors?.Email?.includes('EMAIL_NOT_CONFIRMED')) {
      this.emailNotConfirmed = true;
    } else if (validationErrors?.Email?.includes('LOGIN_FAILED') ||
               errorCode?.error === 'LOGIN_FAILED') {
      this.loginFailed = true;
    } else {
      this.generalError = true;
    }

    if (typeof turnstile !== 'undefined') {
      try { turnstile.reset(`#${this.turnstileContainerId}`); } catch { /* ignore */ }
    }
    this.captchaToken = null;
  }
}
