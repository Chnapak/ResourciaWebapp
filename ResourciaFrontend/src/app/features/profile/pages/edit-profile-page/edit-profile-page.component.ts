/**
 * Profile editing page with live preview and account deletion flow.
 */
import {
  Component,
  DestroyRef,
  OnDestroy,
  OnInit,
  computed,
  inject,
  signal,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { AbstractControl, FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { debounceTime } from 'rxjs/operators';
import { AuthService } from '../../../../core/auth/auth.service';
import { EditProfileForm } from '../../models/edit-profile.model';
import { EditProfileService } from '../../services/edit-profile.service';

@Component({
  selector: 'app-edit-profile-page',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule],
  templateUrl: './edit-profile-page.component.html',
  styleUrls: ['./edit-profile-page.component.scss'],
})
/**
 * Hosts the profile editor form and manages save/delete flows.
 */
export class EditProfilePageComponent implements OnInit, OnDestroy {
  /** Form builder for the editor form. */
  private readonly fb = inject(FormBuilder);
  /** Router used for navigation after save/cancel. */
  private readonly router = inject(Router);
  /** DestroyRef used to clean up subscriptions. */
  private readonly destroyRef = inject(DestroyRef);
  /** Service used to load and save profile data. */
  private readonly editProfileService = inject(EditProfileService);
  /** Auth service used to update current user name and handle deletion. */
  private readonly authService = inject(AuthService);

  /** Tracks whether the form has unsaved changes. */
  readonly isDirty = signal(false);
  /** Live preview data derived from the form. */
  readonly preview = signal<Partial<EditProfileForm>>({});
  /** Current interest input value. */
  readonly interestInput = signal('');
  /** Selected interest tags. */
  readonly interests = signal<string[]>([]);
  /** Whether the editor is loading. */
  readonly isLoading = signal(true);
  /** Error message when loading fails. */
  readonly loadError = signal<string | null>(null);
  /** Whether the delete-account confirm dialog is open. */
  readonly isDeleteConfirmOpen = signal(false);
  /** Whether account deletion is in progress. */
  readonly isDeletingAccount = signal(false);
  /** Error message when account deletion fails. */
  readonly deleteAccountError = signal<string | null>(null);
  /** Save status signal provided by the service. */
  readonly saveStatus = this.editProfileService.saveStatus;
  /** Save message signal provided by the service. */
  readonly saveMessage = this.editProfileService.saveMessage;
  /** Whether an avatar upload is in progress. */
  readonly avatarUploading = signal(false);
  /** Avatar upload error message. */
  readonly avatarError = signal<string | null>(null);
  /** Avatar upload success message. */
  readonly avatarSuccess = signal<string | null>(null);

  /** True when a save request is in progress. */
  readonly isSaving = computed(() => this.saveStatus() === 'saving');
  /** True after a successful save. */
  readonly isSaved = computed(() => this.saveStatus() === 'saved');
  /** True when the last save failed. */
  readonly isError = computed(() => this.saveStatus() === 'error');

  /** Username used for cancel navigation. */
  originalProfileIdentifier = '';
  /** Reactive form instance for the editor. */
  form!: FormGroup;

  /** Initials used when rendering the avatar preview. */
  get avatarInitial(): string {
    const name = (this.form?.get('displayName')?.value as string | null) ?? '';
    return name.trim().charAt(0).toUpperCase() || '?';
  }

  /** Current avatar URL for preview (if available). */
  get avatarUrl(): string | null {
    return (this.preview().avatarUrl ?? null) as string | null;
  }

  /** Current character count for the bio field. */
  get bioCharCount(): number {
    return ((this.form?.get('bio')?.value as string | null) ?? '').length;
  }

  /** Loads the profile and initializes the form. */
  ngOnInit(): void {
    this.editProfileService.load()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (profile) => {
          this.originalProfileIdentifier = profile.username;
          this.interests.set(profile.interests);
          this.initialiseForm(profile);
          this.preview.set({ ...profile });
          this.avatarSuccess.set(null);
          this.avatarError.set(null);
          this.isLoading.set(false);
        },
        error: () => {
          this.loadError.set('We could not load your profile editor right now.');
          this.isLoading.set(false);
        }
      });
  }

  /** Resets save status on component teardown. */
  ngOnDestroy(): void {
    this.editProfileService.resetStatus();
  }

  /** Convenience accessor for the display name control. */
  get displayNameControl(): AbstractControl | null {
    return this.form?.get('displayName') ?? null;
  }

  /** Convenience accessor for the username control. */
  get usernameControl(): AbstractControl | null {
    return this.form?.get('username') ?? null;
  }

  /** Convenience accessor for the bio control. */
  get bioControl(): AbstractControl | null {
    return this.form?.get('bio') ?? null;
  }

  /** Convenience accessor for the website control. */
  get websiteControl(): AbstractControl | null {
    return this.form?.get('website') ?? null;
  }

  /** Adds a new interest tag from the input. */
  addInterest(): void {
    const tag = this.interestInput().trim();
    if (!tag || this.interests().includes(tag) || this.interests().length >= 10) {
      return;
    }

    this.interests.update((items) => [...items, tag]);
    this.interestInput.set('');
    this.pushPreviewFromForm();
    this.markDirty();
  }

  /** Removes a selected interest tag. */
  removeInterest(tag: string): void {
    this.interests.update((items) => items.filter((item) => item !== tag));
    this.pushPreviewFromForm();
    this.markDirty();
  }

  /** Handles enter/comma to submit interest tags. */
  onInterestKeydown(event: KeyboardEvent): void {
    if (event.key === 'Enter' || event.key === ',') {
      event.preventDefault();
      this.addInterest();
    }
  }

  /** Persists the profile changes and navigates to the profile page. */
  onSave(): void {
    if (!this.form || this.form.invalid || this.isSaving()) {
      this.form?.markAllAsTouched();
      return;
    }

    const payload = this.buildPayload();
    this.editProfileService.save(payload)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (savedProfile) => {
          this.originalProfileIdentifier = savedProfile.username;
          this.interests.set(savedProfile.interests);
          this.form.patchValue({
            displayName: savedProfile.displayName,
            username: savedProfile.username,
            bio: savedProfile.bio,
            location: savedProfile.location,
            website: savedProfile.website,
          }, { emitEvent: false });
          this.preview.set({ ...savedProfile });
          this.isDirty.set(false);
          this.authService.updateCurrentUserName(savedProfile.displayName);
          this.router.navigate(['/profile', savedProfile.username]);
        },
        error: () => {
          // The service already exposes the API error state for the action bar.
        }
      });
  }

  /** Handles avatar file selection and upload. */
  onAvatarSelected(event: Event): void {
    const input = event.target as HTMLInputElement | null;
    const file = input?.files?.[0];
    if (!file) {
      return;
    }

    const allowedTypes = new Set(['image/png', 'image/jpeg', 'image/gif']);
    if (!allowedTypes.has(file.type)) {
      this.avatarError.set('Only PNG, JPG, or GIF images are supported.');
      this.avatarSuccess.set(null);
      input.value = '';
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      this.avatarError.set('Avatar images must be 5MB or smaller.');
      this.avatarSuccess.set(null);
      input.value = '';
      return;
    }

    this.avatarUploading.set(true);
    this.avatarError.set(null);
    this.avatarSuccess.set(null);

    this.editProfileService.uploadAvatar(file)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (res) => {
          this.avatarUploading.set(false);
          this.preview.set({
            ...this.preview(),
            avatarUrl: res.avatarUrl,
          });
          this.avatarSuccess.set('Avatar updated.');
          this.markDirty();
          input.value = '';
        },
        error: () => {
          this.avatarUploading.set(false);
          this.avatarError.set('Could not upload avatar. Please try again.');
          input.value = '';
        }
      });
  }

  /** Removes the current avatar. */
  removeAvatar(): void {
    if (this.avatarUploading()) {
      return;
    }

    const confirmed = confirm('Remove your profile photo?');
    if (!confirmed) {
      return;
    }

    this.avatarUploading.set(true);
    this.avatarError.set(null);
    this.avatarSuccess.set(null);

    this.editProfileService.deleteAvatar()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          this.avatarUploading.set(false);
          this.preview.set({
            ...this.preview(),
            avatarUrl: null,
          });
          this.avatarSuccess.set('Avatar removed.');
          this.markDirty();
        },
        error: () => {
          this.avatarUploading.set(false);
          this.avatarError.set('Could not remove avatar. Please try again.');
        }
      });
  }

  /** Navigates back to the profile page without saving. */
  onCancel(): void {
    this.router.navigate(['/profile', this.originalProfileIdentifier || this.form?.get('username')?.value || 'me']);
  }

  /** Opens the delete-account confirmation dialog. */
  openDeleteAccountConfirm(): void {
    this.deleteAccountError.set(null);
    this.isDeleteConfirmOpen.set(true);
  }

  /** Closes the delete-account dialog without action. */
  cancelDeleteAccount(): void {
    this.deleteAccountError.set(null);
    this.isDeleteConfirmOpen.set(false);
  }

  /** Confirms and executes account deletion. */
  confirmDeleteAccount(): void {
    if (this.isDeletingAccount()) {
      return;
    }

    this.isDeletingAccount.set(true);
    this.deleteAccountError.set(null);

    this.editProfileService.deleteAccount()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          this.authService.handleAccountDeleted();
        },
        error: (error) => {
          this.isDeletingAccount.set(false);
          this.deleteAccountError.set(error?.error?.error ?? 'Could not delete your account. Please try again.');
        }
      });
  }

  /** Checks whether a form field has a specific validation error. */
  fieldHasError(controlName: string, errorKey: string): boolean {
    const control = this.form?.get(controlName);
    return !!(control?.hasError(errorKey) && (control.dirty || control.touched));
  }

  /** Initializes the form and binds value-change listeners. */
  private initialiseForm(profile: EditProfileForm): void {
    this.form = this.fb.group({
      displayName: [
        profile.displayName,
        [Validators.required, Validators.minLength(2), Validators.maxLength(50)],
      ],
      username: [
        profile.username,
        [
          Validators.required,
          Validators.minLength(3),
          Validators.maxLength(64),
          Validators.pattern(/^[a-zA-Z0-9._-]+$/),
        ],
      ],
      bio: [profile.bio, [Validators.maxLength(200)]],
      location: [profile.location, [Validators.maxLength(80)]],
      website: [profile.website, [Validators.pattern(/^(https?:\/\/)?[\w.-]+\.[a-z]{2,}.*$/i)]],
    });

    this.form.valueChanges
      .pipe(
        debounceTime(120),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe((value) => {
        this.preview.set({
          ...value,
          interests: this.interests(),
        });

        this.markDirty();

        if (this.saveStatus() === 'saved') {
          this.editProfileService.resetStatus();
        }
      });

  }

  /** Builds the save payload from the current form values. */
  private buildPayload(): EditProfileForm {
    return {
      displayName: (this.form.get('displayName')?.value as string | null) ?? '',
      username: (this.form.get('username')?.value as string | null) ?? '',
      bio: (this.form.get('bio')?.value as string | null) ?? '',
      location: (this.form.get('location')?.value as string | null) ?? '',
      website: (this.form.get('website')?.value as string | null) ?? '',
      interests: this.interests(),
      avatarUrl: this.preview().avatarUrl ?? null,
    };
  }

  /** Syncs the preview state from the current form values. */
  private pushPreviewFromForm(): void {
    if (!this.form) {
      return;
    }

    this.preview.set({
      ...this.form.getRawValue(),
      interests: this.interests(),
      avatarUrl: this.preview().avatarUrl ?? null,
    });
  }

  /** Marks the form as dirty once the initial load completes. */
  private markDirty(): void {
    if (!this.isLoading()) {
      this.isDirty.set(true);
    }
  }
}
