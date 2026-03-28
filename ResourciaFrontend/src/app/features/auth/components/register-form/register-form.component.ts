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
import { environment } from '../../../../../environments/environment.development';

declare var turnstile: any;

@Component({
  selector: 'app-register-form',
  standalone: true,
  imports: [FormsModule, ReactiveFormsModule, RouterLink],
  templateUrl: './register-form.component.html',
})
export class RegisterFormComponent implements AfterViewInit, OnDestroy {
  @Input() isModal = false;
  @Input() instanceId = 'register';
  @Output() registerSuccess = new EventEmitter<string>(); // emits the email on success

  private readonly fb = inject(FormBuilder);
  private readonly authService = inject(AuthService);

  readonly siteKey = environment.siteKey;

  isSubmitting = false;
  isCooldown = false;
  emailInUse = false;
  usernameInUse = false;
  generalError = false;
  cooldownSeconds = 30;
  resendButtonText = 'Resend Email';
  captchaToken: string | null = null;
  showSuccess = false;
  registeredEmail = '';

  get turnstileContainerId(): string {
    return `turnstile-register-${this.instanceId}`;
  }

  private readonly passwordMatchValidator: ValidatorFn = (
    group: AbstractControl
  ): ValidationErrors | null => {
    const password = group.get('password')?.value;
    const confirmPassword = group.get('confirmPassword')?.value;
    return password === confirmPassword ? null : { passwordMismatch: true };
  };

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

  private strictEmailCheck(): ValidatorFn {
    return (control: AbstractControl): ValidationErrors | null => {
      const value = control.value;
      if (!value) return null;
      const valid = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(value);
      return valid ? null : { invalidEmail: true };
    };
  }

  readonly form = this.fb.group(
    {
      displayName: ['', Validators.required],
      email: ['', [Validators.required, this.strictEmailCheck()]],
      password: ['', [Validators.required, Validators.minLength(8), Validators.maxLength(32), this.strengthCheck()]],
      confirmPassword: ['', Validators.required],
    },
    { validators: this.passwordMatchValidator }
  );

  get isSubmitDisabled(): boolean {
    return this.isSubmitting || !this.captchaToken;
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
      },
      'expired-callback': () => {
        this.captchaToken = null;
      },
    });
  }

  onSubmit(): void {
    this.emailInUse = false;
    this.usernameInUse = false;
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
        if (errors?.DisplayName?.includes('USERNAME_ALREADY_IN_USE')) this.usernameInUse = true;
        if (!errors) this.generalError = true;
        this.captchaToken = null;
        if (typeof turnstile !== 'undefined') {
          try { turnstile.reset(`#${this.turnstileContainerId}`); } catch { /* ignore */ }
        }
      },
    });
  }

  resendEmail(): void {
    const email = this.form.get('email')?.value;
    if (!email) return;
    this.startCooldown();
    this.authService.resendEmail({ email }).subscribe();
  }

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
