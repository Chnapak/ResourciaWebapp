/**
 * Service for loading and saving the current user's profile.
 */
import { Injectable, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError, map, tap } from 'rxjs/operators';
import { ProfileViewModel } from '../models/profile.model';
import { EditProfileForm, SaveStatus } from '../models/edit-profile.model';

@Injectable({
  providedIn: 'root'
})
/**
 * Encapsulates profile API calls and save-state signaling.
 */
export class EditProfileService {
  /** HTTP client for profile requests. */
  private readonly httpClient = inject(HttpClient);
  /** Base API path for profile endpoints. */
  private readonly baseUrl = '/api/Profile';

  /** Reactive save status for UI feedback. */
  readonly saveStatus = signal<SaveStatus>('idle');
  /** Optional save message for UI feedback. */
  readonly saveMessage = signal<string | null>(null);

  /** Loads the current user's profile and maps it to the edit form shape. */
  load(): Observable<EditProfileForm> {
    return this.httpClient
      .get<ProfileViewModel>(`${this.baseUrl}/me`)
      .pipe(map((profile) => this.mapProfileToForm(profile)));
  }

  /** Persists the edit form and updates save status signals. */
  save(form: EditProfileForm): Observable<EditProfileForm> {
    this.saveStatus.set('saving');
    this.saveMessage.set(null);

    return this.httpClient
      .patch<ProfileViewModel>(`${this.baseUrl}/me`, {
        displayName: form.displayName,
        handle: form.username,
        bio: form.bio,
        location: form.location,
        website: form.website,
        interests: form.interests,
      })
      .pipe(
        map((profile) => this.mapProfileToForm(profile)),
        tap(() => {
          this.saveStatus.set('saved');
          this.saveMessage.set('Profile saved.');
        }),
        catchError((error) => {
          this.saveStatus.set('error');
          this.saveMessage.set(error?.error?.error ?? 'Could not save profile. Please try again.');
          return throwError(() => error);
        })
      );
  }

  /** Deletes the current user's account. */
  deleteAccount(): Observable<void> {
    return this.httpClient.delete<void>(`${this.baseUrl}/me`);
  }

  /** Uploads a new avatar image for the current user. */
  uploadAvatar(file: File): Observable<{ avatarUrl: string }> {
    const formData = new FormData();
    formData.append('file', file);
    return this.httpClient.post<{ avatarUrl: string }>(`${this.baseUrl}/me/avatar`, formData);
  }

  /** Removes the current user's avatar. */
  deleteAvatar(): Observable<void> {
    return this.httpClient.delete<void>(`${this.baseUrl}/me/avatar`);
  }

  /** Resets save status and message to defaults. */
  resetStatus(): void {
    this.saveStatus.set('idle');
    this.saveMessage.set(null);
  }

  /** Maps the API profile response into the edit form model. */
  private mapProfileToForm(profile: ProfileViewModel): EditProfileForm {
    return {
      displayName: profile.name ?? '',
      username: profile.handle ?? '',
      bio: profile.bio ?? '',
      location: profile.location ?? '',
      website: profile.website ?? '',
      interests: profile.interests ?? [],
      avatarUrl: profile.avatarUrl ?? null,
    };
  }
}
