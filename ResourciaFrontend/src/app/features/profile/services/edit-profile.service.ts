import { Injectable, inject, signal } from '@angular/core';
import { Observable, of } from 'rxjs';
import { delay, map, tap } from 'rxjs/operators';
import { ProfileService } from '../../../core/services/profile.service';
import { EditProfileForm, SaveStatus } from '../models/edit-profile.model';

const EDIT_PROFILE_DRAFT_KEY = 'resourcia.editProfileDraft';

@Injectable({
  providedIn: 'root'
})
export class EditProfileService {
  private readonly profileService = inject(ProfileService);

  readonly saveStatus = signal<SaveStatus>('idle');
  readonly saveMessage = signal<string | null>(null);

  load(): Observable<EditProfileForm> {
    return this.profileService.getProfile('me').pipe(
      map((profile) => {
        const baseProfile: EditProfileForm = {
          displayName: profile.name ?? '',
          username: profile.handle ?? '',
          bio: profile.bio ?? '',
          location: profile.location ?? '',
          website: profile.website ?? '',
          interests: profile.interests ?? [],
          avatarUrl: null,
        };

        return this.mergeDraft(baseProfile);
      })
    );
  }

  save(form: EditProfileForm): Observable<void> {
    this.saveStatus.set('saving');
    this.saveMessage.set(null);
    this.storeDraft(form);

    return of(undefined).pipe(
      delay(450),
      tap(() => {
        this.saveStatus.set('saved');
        this.saveMessage.set('Draft saved locally. Backend profile updates are not wired yet.');
      })
    );
  }

  resetStatus(): void {
    this.saveStatus.set('idle');
    this.saveMessage.set(null);
  }

  clearDraft(): void {
    sessionStorage.removeItem(EDIT_PROFILE_DRAFT_KEY);
  }

  private mergeDraft(profile: EditProfileForm): EditProfileForm {
    try {
      const storedDraft = sessionStorage.getItem(EDIT_PROFILE_DRAFT_KEY);
      if (!storedDraft) {
        return profile;
      }

      const parsed = JSON.parse(storedDraft) as Partial<EditProfileForm>;
      return {
        ...profile,
        ...parsed,
        interests: Array.isArray(parsed.interests) ? parsed.interests : profile.interests,
      };
    } catch {
      return profile;
    }
  }

  private storeDraft(form: EditProfileForm): void {
    sessionStorage.setItem(EDIT_PROFILE_DRAFT_KEY, JSON.stringify(form));
  }
}
