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
import { EditProfileForm } from '../../models/edit-profile.model';
import { EditProfileService } from '../../services/edit-profile.service';

@Component({
  selector: 'app-edit-profile-page',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule],
  templateUrl: './edit-profile-page.component.html',
  styleUrls: ['./edit-profile-page.component.scss'],
})
export class EditProfilePageComponent implements OnInit, OnDestroy {
  private readonly fb = inject(FormBuilder);
  private readonly router = inject(Router);
  private readonly destroyRef = inject(DestroyRef);
  private readonly editProfileService = inject(EditProfileService);

  readonly isDirty = signal(false);
  readonly preview = signal<Partial<EditProfileForm>>({});
  readonly interestInput = signal('');
  readonly interests = signal<string[]>([]);
  readonly isLoading = signal(true);
  readonly loadError = signal<string | null>(null);
  readonly saveStatus = this.editProfileService.saveStatus;
  readonly saveMessage = this.editProfileService.saveMessage;

  readonly isSaving = computed(() => this.saveStatus() === 'saving');
  readonly isSaved = computed(() => this.saveStatus() === 'saved');
  readonly isError = computed(() => this.saveStatus() === 'error');

  originalProfileIdentifier = '';
  form!: FormGroup;

  get avatarInitial(): string {
    const name = (this.form?.get('displayName')?.value as string | null) ?? '';
    return name.trim().charAt(0).toUpperCase() || '?';
  }

  get bioCharCount(): number {
    return ((this.form?.get('bio')?.value as string | null) ?? '').length;
  }

  ngOnInit(): void {
    this.editProfileService.load()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (profile) => {
          this.originalProfileIdentifier = profile.displayName;
          this.interests.set(profile.interests);
          this.initialiseForm(profile);
          this.preview.set({ ...profile });
          this.isLoading.set(false);
        },
        error: () => {
          this.loadError.set('We could not load your profile editor right now.');
          this.isLoading.set(false);
        }
      });
  }

  ngOnDestroy(): void {
    this.editProfileService.resetStatus();
  }

  get displayNameControl(): AbstractControl | null {
    return this.form?.get('displayName') ?? null;
  }

  get usernameControl(): AbstractControl | null {
    return this.form?.get('username') ?? null;
  }

  get bioControl(): AbstractControl | null {
    return this.form?.get('bio') ?? null;
  }

  get websiteControl(): AbstractControl | null {
    return this.form?.get('website') ?? null;
  }

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

  removeInterest(tag: string): void {
    this.interests.update((items) => items.filter((item) => item !== tag));
    this.pushPreviewFromForm();
    this.markDirty();
  }

  onInterestKeydown(event: KeyboardEvent): void {
    if (event.key === 'Enter' || event.key === ',') {
      event.preventDefault();
      this.addInterest();
    }
  }

  onSave(): void {
    if (!this.form || this.form.invalid || this.isSaving()) {
      this.form?.markAllAsTouched();
      return;
    }

    const payload = this.buildPayload();
    this.editProfileService.save(payload)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          this.isDirty.set(false);
        },
        error: () => {
          this.editProfileService.saveStatus.set('error');
          this.editProfileService.saveMessage.set('Could not save your local draft.');
        }
      });
  }

  onCancel(): void {
    this.router.navigate(['/profile', this.originalProfileIdentifier || this.form?.get('displayName')?.value || 'me']);
  }

  fieldHasError(controlName: string, errorKey: string): boolean {
    const control = this.form?.get(controlName);
    return !!(control?.hasError(errorKey) && (control.dirty || control.touched));
  }

  private initialiseForm(profile: EditProfileForm): void {
    this.form = this.fb.group({
      displayName: [
        profile.displayName,
        [Validators.required, Validators.minLength(2), Validators.maxLength(50)],
      ],
      username: [
        profile.username,
        [Validators.required, Validators.minLength(3), Validators.maxLength(30)],
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
        const nextUsername = this.buildHandle((value.displayName as string | null) ?? '');
        if (this.form.get('username')?.value !== nextUsername) {
          this.form.get('username')?.setValue(nextUsername, { emitEvent: false });
        }

        this.preview.set({
          ...value,
          username: nextUsername,
          interests: this.interests(),
        });

        this.markDirty();

        if (this.saveStatus() === 'saved') {
          this.editProfileService.resetStatus();
        }
      });

    this.form.get('displayName')
      ?.valueChanges
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((displayName) => {
        const nextUsername = this.buildHandle((displayName as string | null) ?? '');
        this.form.get('username')?.setValue(nextUsername, { emitEvent: false });
      });
  }

  private buildPayload(): EditProfileForm {
    return {
      displayName: (this.form.get('displayName')?.value as string | null) ?? '',
      username: (this.form.get('username')?.value as string | null) ?? '',
      bio: (this.form.get('bio')?.value as string | null) ?? '',
      location: (this.form.get('location')?.value as string | null) ?? '',
      website: (this.form.get('website')?.value as string | null) ?? '',
      interests: this.interests(),
      avatarUrl: null,
    };
  }

  private pushPreviewFromForm(): void {
    if (!this.form) {
      return;
    }

    this.preview.set({
      ...this.form.getRawValue(),
      interests: this.interests(),
    });
  }

  private markDirty(): void {
    if (!this.isLoading()) {
      this.isDirty.set(true);
    }
  }

  private buildHandle(displayName: string): string {
    return displayName.trim().toLowerCase().replace(/\s+/g, '');
  }
}
