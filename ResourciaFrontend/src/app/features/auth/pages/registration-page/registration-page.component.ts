/**
 * Full-page registration view with Turnstile captcha.
 */
import { AfterViewInit, Component, inject } from '@angular/core';
import { 
  AbstractControl, FormBuilder, Validators, ValidatorFn, ValidationErrors, 
  FormsModule, ReactiveFormsModule 
} from '@angular/forms';
import { Router, RouterLink, RouterModule } from '@angular/router';
import { AuthService } from '../../../../core/auth/auth.service';
import { RegisterModel } from '../../models/register';
import { environment } from '../../../../../environments/environment';
import { ResendConfirmationModel } from '../../models/resend-confirmation';

declare var turnstile: any;

@Component({
  selector: 'app-registration-page',
  standalone: true,
  imports: [FormsModule, ReactiveFormsModule, RouterLink],
  templateUrl: './registration-page.component.html',
  styleUrl: './registration-page.component.scss',
})
/**
 * Collects registration info and triggers confirmation emails.
 */
export class RegistrationPageComponent {
  /** Form builder for the registration form. */
  private readonly fb = inject(FormBuilder);
  /** Auth service used to register users. */
  private readonly authService = inject(AuthService);
  /** Router used for navigation after successful registration. */
  private readonly router = inject(Router);

  /** Turnstile site key for captcha rendering. */
  public readonly siteKey = environment.siteKey;
  /** Base API path for external auth providers. */
  private readonly baseUrl = '/api/Auth';

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
  /** Reference to the resend button element (optional). */
  resendButton = document.getElementById('resend-button ');
  /** Label shown on the resend button during cooldown. */
  resendButtonText = 'Resend Email';


  /** Renders the Turnstile widget after the view initializes. */
  ngAfterViewInit() {
    turnstile.render('#turnstile-container', {
    sitekey: this.siteKey,
    theme: 'light'
    });
  }

  /** Validator that checks password and confirmation match. */
  private passwordMatchValidator: ValidatorFn = (
    group: AbstractControl
  ): ValidationErrors | null => {
    const password = group.get('password')?.value;
    const confirmPassword = group.get('confirmPassword')?.value;
    return password === confirmPassword ? null : { passwordMismatch: true };
  };

  /** Validator that enforces a basic password strength policy. */
  private strengthCheck() {
    return (control: AbstractControl): ValidationErrors | null => {
      const value = control.value;
      if (!value) return null;

      const hasUpperCase = /[A-Z]/.test(value);
      const hasNumber = /[0-9]/.test(value);
      const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(value);

      const fufilled = hasUpperCase && hasNumber && hasSpecialChar;
      return fufilled ? null : { passwordStrength: true }
    }
  }

  /** Validator that applies a stricter email format check. */
  private strictEmailCheck() {
    return (control: AbstractControl): ValidationErrors | null => {
      const value = control.value;
      if (!value) return null;

      const regex = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
      const valid = regex.test(value);

      return valid ? null : { invalidEmail: true };
    }
  }

  /** Registration form with validation rules. */
  public form = this.fb.group(
    {
      displayName: ['', Validators.required],
      email: ['', [Validators.required, this.strictEmailCheck()]], 
      password: ['', [Validators.required, Validators.minLength(8), Validators.maxLength(32), this.strengthCheck()]],
      confirmPassword: ['', Validators.required],
    },
    { validators: this.passwordMatchValidator,

     }
  );

  

  /** Validates input and submits the registration request. */
  protected onSubmit(): void {
    this.isSubmitting = true;
    const tokenInput = document.querySelector('input[name="cf-turnstile-response"]');
    const token = tokenInput ? tokenInput.getAttribute('value') : null;

    if (token === null) {
      // What do I write here?
      this.isSubmitting = false;
      return;
    }
    
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      this.isSubmitting = false;
      return;
    }

    this.isSubmitting = true;

    const formData = this.form.getRawValue();
    const registerData: RegisterModel = {
      displayName: formData.displayName!,
      email: formData.email!,
      password: formData.password!,
      confirmPassword: formData.confirmPassword!,
      captchaToken: token,
    };
    
    this.authService.register(registerData).subscribe({
      next: () => {
        this.isSubmitting = false;
        this.emailInUse = false;
        this.usernameInUse = false;
        this.inviteRequired = false;
        this.generalError = false;

        var cover = document.getElementById('cover');
        cover?.classList.add('success');

        var popUp = document.getElementById('pop-up');
        popUp?.classList.add('success');
      },
      error: (error) => {
        console.error('Registration failed:', error);
        this.isSubmitting = false;
      
        const errors = error?.error?.errors;

        if (errors) {
          if (errors.Email?.includes('EMAIL_ALREADY_IN_USE')) {
            this.emailInUse = true;
          }

          if (errors.Email?.includes('REGISTRATION_INVITE_REQUIRED')) {
            this.inviteRequired = true;
          }
          
          if (errors.DisplayName?.includes('USERNAME_ALREADY_IN_USE')) {
            this.usernameInUse = true;
          }
          if (!this.emailInUse && !this.usernameInUse && !this.inviteRequired) {
            this.generalError = true;
          }
          } else {
          this.generalError = true;
        }
      },
    });
  }

  /** Resends the confirmation email and starts cooldown. */
  resendEmail() {
    console.log('Resending Email...');
    this.startCooldown();

    const formData = this.form.getRawValue();
    const resendData: ResendConfirmationModel = {
      email: formData.email!
    };

    this.authService.resendEmail(resendData).subscribe({
      next: () => {

      },
      error: (error) => {
        console.error('Resend failed:', error)
      }
    });
  }

  /** Starts the resend cooldown timer and updates button text. */
  startCooldown() {
    this.isCooldown = true;
    let remaining = this.cooldownSeconds;

    this.resendButtonText = $localize`Resend availabe in ${remaining}s`;

    const interval = setInterval(() => {
      remaining--;
      if (remaining > 0) {
        this.resendButtonText = $localize`Resend availabe in ${remaining}s`;
      }
      else {
        clearInterval(interval)
        this.isCooldown = false;
        this.resendButtonText = $localize`Resend Email`;
      }
    }, 1000)
  }

  /** Redirects to the external login provider flow. */
  loginWithProvider(provider: string) {
    window.location.href = `${this.baseUrl}/ExternalLogin?provider=${provider}`;
  }
}

