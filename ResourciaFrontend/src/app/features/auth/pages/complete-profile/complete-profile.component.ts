import { Component, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { AuthService } from '../../../../core/auth/auth.service';
import { ActivatedRoute, Router } from '@angular/router';
import { ButtonComponent } from '../../../../shared/ui/button/button.component';
import { TextfieldComponent } from '../../../../shared/ui/textfield/textfield.component';
import { delay } from 'rxjs';

@Component({
  selector: 'app-complete-profile',
  imports: [ ReactiveFormsModule, ButtonComponent, TextfieldComponent],
  templateUrl: './complete-profile.component.html',
  styleUrl: './complete-profile.component.scss',
})
export class CompleteProfileComponent {
  private readonly fb = inject(FormBuilder);
  private readonly authService = inject(AuthService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);

  private registrationToken: string | null = null;
  public isSubmitting = false;
  public usernameInUse = false;
  public generalError = false;

  protected form = this.fb.nonNullable.group({
    displayName: ['', [Validators.required, Validators.minLength(3)]],
  });

  ngOnInit(): void {
    // Capture the token from the URL: ?registrationToken=...
    this.registrationToken = this.route.snapshot.queryParamMap.get('registrationToken');
    
    if (!this.registrationToken) {
      console.error('Registration token is missing from the URL.');
      this.generalError = true;
    }
  }

  onSubmit(): void {
    if (this.form.invalid || !this.registrationToken) {
      this.form.markAllAsTouched();
      return;
    }

    this.isSubmitting = true;
    this.usernameInUse = false;
    this.generalError = false;

    // Must match the C# model: { displayName, registrationToken }
    const payload = {
      displayName: this.form.getRawValue().displayName,
      registrationToken: this.registrationToken
    };

    this.authService.completeExternalLogin(payload).subscribe({
      next: (res: { token: string }) => {
        this.authService.establishAuthenticatedSession(res.token);
        this.router.navigate(['/']); 
      },
      error: (err) => {
        console.log(err)
        this.isSubmitting = false;
        // Check for the 'USERNAME_ALREADY_IN_USE' error you set in C#
        const validationErrors = err.error?.errors;
        if (validationErrors?.displayName?.includes('USERNAME_ALREADY_IN_USE')) {
          this.usernameInUse = true;
        } else {
          this.generalError = true;
        }
      }
    });
  }
}
