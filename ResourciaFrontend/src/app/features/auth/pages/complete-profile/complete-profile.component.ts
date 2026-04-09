/**
 * Page that completes an external-auth profile (display name).
 */
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
/**
 * Collects a display name and exchanges the registration token for a session.
 */
export class CompleteProfileComponent {
  /** Form builder for the display name form. */
  private readonly fb = inject(FormBuilder);
  /** Auth service used to complete external login. */
  private readonly authService = inject(AuthService);
  /** Route used to read the registration token. */
  private readonly route = inject(ActivatedRoute);
  /** Router used for post-completion navigation. */
  private readonly router = inject(Router);

  /** Registration token provided by the external auth flow. */
  private registrationToken: string | null = null;
  /** Whether the submit call is in progress. */
  public isSubmitting = false;
  /** True when the chosen username already exists. */
  public usernameInUse = false;
  /** True when a non-specific error occurs. */
  public generalError = false;

  /** Reactive form for the display name. */
  protected form = this.fb.nonNullable.group({
    displayName: ['', [Validators.required, Validators.minLength(3)]],
  });

  /** Reads the registration token from the query string. */
  ngOnInit(): void {
    // Capture the token from the URL: ?registrationToken=...
    this.registrationToken = this.route.snapshot.queryParamMap.get('registrationToken');
    
    if (!this.registrationToken) {
      console.error('Registration token is missing from the URL.');
      this.generalError = true;
    }
  }

  /** Validates input and completes the external login flow. */
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
      next: () => {
        this.authService.initAuth().then(() => {
          this.router.navigate(['/']);
        });
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
