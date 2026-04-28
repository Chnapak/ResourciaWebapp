/**
 * Registration form component with Turnstile captcha and validation.
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
  AbstractControl,
  FormBuilder,
  FormsModule,
  ReactiveFormsModule,
  ValidationErrors,
  ValidatorFn,
  Validators,
} from '@angular/forms';
import { RouterLink } from '@angular/router';
import { AuthService } from '../../../../core/auth/auth.service';
import { RegisterModel } from '../../models/register';
import { environment } from '../../../../../environments/environment';

declare var turnstile: any;

@Component({
  selector: 'app-register-form',
  standalone: true,
  imports: [FormsModule, ReactiveFormsModule, RouterLink],
  templateUrl: './register-form.component.html',
})
/**
 * Collects registration details and submits to the auth service.
 */
export class RegisterFormComponent implements AfterViewInit, OnDestroy {
  /** When true, adjusts layout for use inside the auth modal. */
  @Input() isModal = false;
  /** Unique suffix so multiple instances don't clash. */
  @Input() instanceId = 'register';
  /** Emits the registered email on successful signup. */
  @Output() registerSuccess = new EventEmitter<string>(); // emits the email on success

  /** Form builder for reactive form creation. */
  private readonly fb = inject(FormBuilder);
  /** Auth service used to perform registration calls. */
  private readonly authService = inject(AuthService);

  /** Turnstile site key for captcha rendering. */
  readonly siteKey = environment.siteKey;

  /** Whether a register request is in progress. */
  isSubmitting = false;
  /** Whether resend confirmation is in cooldown. */
  isCooldown = false;
  /** True when the email is already in use. */
  emailInUse = false;
  /** True when the display name is already in use. */
  usernameInUse = false;
  /** True when registration is limited to invited beta testers. */
  inviteRequired = false;
  /** True when a non-specific error occurs. */
  generalError = false;
  /** Cooldown duration in seconds for resend link. */
  cooldownSeconds = 30;
  /** Label shown on the resend button during cooldown. */
  resendButtonText = 'Resend Email';
  /** Captcha token returned by Turnstile. */
  captchaToken: string | null = null;
  /** Whether to show the post-registration success panel. */
  showSuccess = false;
  /** Email used in the successful registration. */
  registeredEmail = '';

  /** Unique element id used for the Turnstile container. */
  get turnstileContainerId(): string {
    return `turnstile-register-${this.instanceId}`;
  }

  /** Validator that checks password and confirmation match. */
  private readonly passwordMatchValidator: ValidatorFn = (
    group: AbstractControl
  ): ValidationErrors | null => {
    const password = group.get('password')?.value;
    const confirmPassword = group.get('confirmPassword')?.value;
    return password === confirmPassword ? null : { passwordMismatch: true };
  };

  /** Validator that enforces a basic password strength policy. */
  private strengthCheck(): ValidatorFn {
    return (control: AbstractControl): ValidationErrors | null => {
      const value = control.value;
      if (!value) return null;
      const hasUpperCase = /[A-Z]/.test(value);
      const hasNumber = /[0-9]/.test(value);
      const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(value);
      return hasUpperCase && hasNumber && hasSpecialChar ? null : { passwordStrength: true };
    };
  }

  /** Validator that applies a stricter email format check. */
  private strictEmailCheck(): ValidatorFn {
    return (control: AbstractControl): ValidationErrors | null => {
      const value = control.value;
      if (!value) return null;
      const valid = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(value);
      return valid ? null : { invalidEmail: true };
    };
  }

  /** Reactive registration form with validation rules. */
  readonly form = this.fb.group(
    {
      displayName: ['', Validators.required],
      email: ['', [Validators.required, this.strictEmailCheck()]],
      password: ['', [Validators.required, Validators.minLength(8), Validators.maxLength(32), this.strengthCheck()]],
      confirmPassword: ['', Validators.required],
    },
    { validators: this.passwordMatchValidator }
  );

  /** Disables submit while loading or without a captcha token. */
  get isSubmitDisabled(): boolean {
    return this.isSubmitting || !this.captchaToken;
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
      },
      'expired-callback': () => {
        this.captchaToken = null;
      },
    });
  }

  /** Validates input and submits the registration request. */
  onSubmit(): void {
    this.emailInUse = false;
    this.usernameInUse = false;
    this.inviteRequired = false;
    this.generalError = false;

    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    if (!this.captchaToken) return;

    this.isSubmitting = true;
    const formData = this.form.getRawValue();
    const registerData: RegisterModel = {
      displayName: formData.displayName!,
      email: formData.email!,
      password: formData.password!,
      confirmPassword: formData.confirmPassword!,
      captchaToken: this.captchaToken,
    };

    this.authService.register(registerData).subscribe({
      next: () => {
        this.isSubmitting = false;
        this.registeredEmail = formData.email!;
        this.showSuccess = true;
        this.registerSuccess.emit(this.registeredEmail);
      },
      error: (error) => {
        this.isSubmitting = false;
        const errors = error?.error?.errors;
        if (errors?.Email?.includes('EMAIL_ALREADY_IN_USE')) this.emailInUse = true;
        if (errors?.Email?.includes('REGISTRATION_INVITE_REQUIRED')) this.inviteRequired = true;
        if (errors?.DisplayName?.includes('USERNAME_ALREADY_IN_USE')) this.usernameInUse = true;
        if (!errors || (!this.emailInUse && !this.usernameInUse && !this.inviteRequired)) this.generalError = true;
        this.captchaToken = null;
        if (typeof turnstile !== 'undefined') {
          try { turnstile.reset(`#${this.turnstileContainerId}`); } catch { /* ignore */ }
        }
      },
    });
  }

  /** Resends the confirmation email and starts cooldown. */
  resendEmail(): void {
    const email = this.form.get('email')?.value;
    if (!email) return;
    this.startCooldown();
    this.authService.resendEmail({ email }).subscribe();
  }

  /** Starts the resend cooldown timer and updates button text. */
  startCooldown(): void {
    this.isCooldown = true;
    let remaining = this.cooldownSeconds;
    this.resendButtonText = `Resend available in ${remaining}s`;
    const interval = setInterval(() => {
      remaining--;
      if (remaining > 0) {
        this.resendButtonText = `Resend available in ${remaining}s`;
      } else {
        clearInterval(interval);
        this.isCooldown = false;
        this.resendButtonText = 'Resend Email';
      }
    }, 1000);
  }
}
