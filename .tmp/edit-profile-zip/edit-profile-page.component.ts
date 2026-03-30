import {
  Component,
  OnInit,
  OnDestroy,
  inject,
  signal,
  computed,
  DestroyRef,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  FormBuilder,
  FormGroup,
  Validators,
  ReactiveFormsModule,
  AbstractControl,
} from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { debounceTime, distinctUntilChanged } from 'rxjs/operators';

import { EditProfileService } from '../../services/edit-profile.service';
import { EditProfileForm, EDIT_PROFILE_FIELDS } from '../../models/edit-profile.model';
import { AuthService } from '../../../../core/auth/auth.service';

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
  readonly editProfileService = inject(EditProfileService);
  readonly authService = inject(AuthService);

  readonly fields = EDIT_PROFILE_FIELDS;

  /** Tracks whether the form has unsaved changes */
  readonly isDirty = signal(false);

  /** Live preview data — updates as the user types */
  readonly preview = signal<Partial<EditProfileForm>>({});

  /** Interests input state */
  readonly interestInput = signal('');
  readonly interests = signal<string[]>([]);

  readonly saveStatus = this.editProfileService.saveStatus;
  readonly saveError = this.editProfileService.saveError;

  readonly isSaving = computed(() => this.saveStatus() === 'saving');
  readonly isSaved = computed(() => this.saveStatus() === 'saved');
  readonly isError = computed(() => this.saveStatus() === 'error');

  form!: FormGroup;

  /** Computed initials for avatar fallback */
  get avatarInitial(): string {
    const name = this.form?.get('displayName')?.value as string ?? '';
    return name.trim().charAt(0).toUpperCase() || '?';
  }

  get usernameControl(): AbstractControl {
    return this.form.get('username')!;
  }

  get displayNameControl(): AbstractControl {
    return this.form.get('displayName')!;
  }

  get bioControl(): AbstractControl {
    return this.form.get('bio')!;
  }

  get websiteControl(): AbstractControl {
    return this.form.get('website')!;
  }

  get bioCharCount(): number {
    return (this.form?.get('bio')?.value as string ?? '').length;
  }

  ngOnInit(): void {
    // Seed form from current auth state
    // In a real scenario, fetch full profile via GET /api/Profile/{username}
    const currentUser = this.authService.currentUser?.();

    this.form = this.fb.group({
      displayName: [
        currentUser?.userName ?? '',
        [Validators.required, Validators.minLength(2), Validators.maxLength(50)],
      ],
      username: [
        currentUser?.userName ?? '',
        [
          Validators.required,
          Validators.minLength(3),
          Validators.maxLength(30),
          Validators.pattern(/^[a-z0-9_.-]+$/i),
        ],
      ],
      bio: ['', [Validators.maxLength(200)]],
      location: ['', [Validators.maxLength(80)]],
      website: ['', [Validators.pattern(/^(https?:\/\/)?.+\..+/)]],
    });

    // Push initial value to preview
    this.preview.set(this.form.value as Partial<EditProfileForm>);

    // Keep preview in sync with live typing
    this.form.valueChanges
      .pipe(debounceTime(120), distinctUntilChanged(), takeUntilDestroyed(this.destroyRef))
      .subscribe(val => {
        this.preview.set({ ...val, interests: this.interests() });
        this.isDirty.set(true);
        if (this.saveStatus() === 'saved') {
          this.editProfileService.resetStatus();
        }
      });
  }

  addInterest(): void {
    const tag = this.interestInput().trim();
    if (tag && !this.interests().includes(tag) && this.interests().length < 10) {
      this.interests.update(list => [...list, tag]);
      this.interestInput.set('');
      this.isDirty.set(true);
    }
  }

  removeInterest(tag: string): void {
    this.interests.update(list => list.filter(t => t !== tag));
    this.isDirty.set(true);
  }

  onInterestKeydown(event: KeyboardEvent): void {
    if (event.key === 'Enter' || event.key === ',') {
      event.preventDefault();
      this.addInterest();
    }
  }

  onSave(): void {
    if (this.form.invalid || this.isSaving()) return;

    const payload: EditProfileForm = {
      ...this.form.value,
      interests: this.interests(),
      avatarUrl: null,
    };

    this.editProfileService
      .save(payload)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          this.isDirty.set(false);
          // Navigate to updated public profile after short delay
          setTimeout(() => {
            const username = this.form.get('username')?.value as string;
            this.router.navigate(['/profile', username]);
          }, 1200);
        },
        error: () => {
          // error state handled by service signal
        },
      });
  }

  onCancel(): void {
    const username =
      this.authService.currentUser?.()?.userName ??
      this.form.get('username')?.value;
    this.router.navigate(['/profile', username]);
  }

  fieldHasError(controlName: string, errorKey: string): boolean {
    const ctrl = this.form.get(controlName);
    return !!(ctrl?.hasError(errorKey) && (ctrl.dirty || ctrl.touched));
  }

  ngOnDestroy(): void {
    this.editProfileService.resetStatus();
  }
}
