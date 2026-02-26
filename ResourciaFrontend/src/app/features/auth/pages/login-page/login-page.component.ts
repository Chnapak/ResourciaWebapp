import { Component, inject } from '@angular/core';
import { FormBuilder, FormControl, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { AuthService } from '../../../../core/auth/auth.service';
import { Router } from '@angular/router';
import { environment } from '../../../../../environments/environment.development';

declare var turnstile: any;

@Component({
  selector: 'app-login-page',
  standalone: true,
  imports: [ FormsModule , ReactiveFormsModule ],
  templateUrl: './login-page.component.html',
  styleUrl: './login-page.component.scss'
})
export class LoginPageComponent {
  protected readonly fb = inject(FormBuilder);
  protected readonly authService = inject(AuthService);
  protected readonly router = inject(Router);
  
  public readonly siteKey = environment.siteKey;
  
  public isSubmitting = false;
  public loginFailed = false;
  public generalError = false;
  public captchaFailed = false;

  ngAfterViewInit() {
    turnstile.render('#turnstile-container', {
    sitekey: this.siteKey,
    theme: 'light'
    });
  }

  protected form = this.fb.group({
    email: new FormControl('', { nonNullable: true}),
    password: new FormControl('', { nonNullable: true})
  });

  onSubmit(): void {
    this.isSubmitting = true;
    const tokenInput = document.querySelector('input[name="cf-turnstile-response"]');
    const token = tokenInput ? tokenInput.getAttribute('value') : null;

    if (token === null) {
      // What do I write here?
      this.isSubmitting = false;
      console.error("Captcha not complete")
      return;
    }

    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    
    const data = this.form.getRawValue();
    

    this.authService.login(data).subscribe({
      next: async () => {
          await this.router.navigate(['/']);
      },
      error: (error) => {
        console.error('Registration failed:', error);
        this.isSubmitting = false;
      
        const validationErrors = error?.error?.errors;
        const errorCode = error?.error;

        if (validationErrors) {
          if (validationErrors.Email?.includes('LOGIN_FAILED')) {
            this.loginFailed = true;
          }
        }
        else if (errorCode.error == 'USER_LOCKED_OUT') {
            this.router.navigate(['/suspended'], {
              state: {
                reason: errorCode.reason,
                type: 'Temporary',
                restoreDate: errorCode.until,
                caseId: 'RSC-20260226-4471'
              }
            });

        }
        else {
          this.generalError = true;
        }
      }
    });
  }

}
