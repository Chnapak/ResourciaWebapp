import { AfterViewInit, Component, inject } from '@angular/core';
import { 
  AbstractControl, FormBuilder, Validators, ValidatorFn, ValidationErrors, 
  FormsModule, ReactiveFormsModule 
} from '@angular/forms';
import { Router, RouterLink, RouterModule } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { RegisterModel } from '../../models/register';
import { environment } from '../../../environments/environment.development';
import { ResendConfirmationModel } from '../../models/resend-confirmation';

declare var turnstile: any;

@Component({
  selector: 'app-registration-page',
  standalone: true,
  imports: [FormsModule, ReactiveFormsModule, RouterLink],
  templateUrl: './registration-page.component.html',
  styleUrl: './registration-page.component.scss',
})
export class RegistrationPageComponent {
  private readonly fb = inject(FormBuilder);
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);

  public readonly siteKey = environment.siteKey;

  isSubmitting = false;
  isCooldown = false;
  emailInUse = false;
  usernameInUse = false;
  generalError = false;
  cooldownSeconds = 30;
  resendButton = document.getElementById('resend-button ');
  resendButtonText = 'Resend Email';


  ngAfterViewInit() {
    turnstile.render('#turnstile-container', {
    sitekey: this.siteKey,
    theme: 'light'
    });
  }

  private passwordMatchValidator: ValidatorFn = (
    group: AbstractControl
  ): ValidationErrors | null => {
    const password = group.get('password')?.value;
    const confirmPassword = group.get('confirmPassword')?.value;
    return password === confirmPassword ? null : { passwordMismatch: true };
  };

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

  private strictEmailCheck() {
    return (control: AbstractControl): ValidationErrors | null => {
      const value = control.value;
      if (!value) return null;

      const regex = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
      const valid = regex.test(value);

      return valid ? null : { invalidEmail: true };
    }
  }

  // Form group with password match validator
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
          
          if (errors.DisplayName?.includes('USERNAME_ALREADY_IN_USE')) {
            this.usernameInUse = true;
          }
          } else {
          this.generalError = true;
        }
      },
    });
  }

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

  startCooldown() {
    this.isCooldown = true;
    let remaining = this.cooldownSeconds;

    this.resendButtonText = `Resend availabe in ${remaining}s`;

    const interval = setInterval(() => {
      remaining--;
      if (remaining > 0) {
        this.resendButtonText = `Resend availabe in ${remaining}s`;
      }
      else {
        clearInterval(interval)
        this.isCooldown = false;
        this.resendButtonText = `Resend Email`;
      }
    }, 1000)
  }
}

