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
import { environment } from '../../../../../environments/environment.development';

declare var turnstile: any;

@Component({
  selector: 'app-login-form',
  standalone: true,
  imports: [TextfieldComponent, ButtonComponent, FormsModule, ReactiveFormsModule, RouterLink],
  templateUrl: './login-form.component.html',
})
export class LoginFormComponent implements AfterViewInit, OnDestroy {
  /** When true, adjusts layout for use inside the auth modal */
  @Input() isModal = false;
  /** Unique suffix so multiple instances don't clash */
  @Input() instanceId = 'login';

  /** Emitted on successful login so parent can close modal / navigate */
  @Output() loginSuccess = new EventEmitter<void>();

  private readonly fb = inject(FormBuilder);
  private readonly router = inject(Router);
  readonly authService = inject(AuthService);

  readonly siteKey = environment.siteKey;

  isSubmitting = false;
  loginFailed = false;
  emailNotConfirmed = false;
  generalError = false;
  captchaFailed = false;
  captchaToken: string | null = null;

  readonly form = this.fb.nonNullable.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required]],
  });

  get turnstileContainerId(): string {
    return `turnstile-login-${this.instanceId}`;
  }

  ngAfterViewInit(): void {
    this.renderTurnstile();
  }

  ngOnDestroy(): void {
    if (typeof turnstile !== 'undefined') {
      try { turnstile.remove(`#${this.turnstileContainerId}`); } catch { /* ignore */ }
    }
  }

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

  get isSubmitDisabled(): boolean {
    return this.isSubmitting || !this.captchaToken;
  }

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

  resendConfirmation(): void {
    const email = this.form.get('email')?.value;
    if (!email) return;
    this.authService.resendEmail({ email }).subscribe();
  }

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
