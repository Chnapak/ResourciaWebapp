import { Injectable, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError, map, tap } from 'rxjs/operators';
import { ProfileViewModel } from '../models/profile.model';
import { EditProfileForm, SaveStatus } from '../models/edit-profile.model';

@Injectable({
  providedIn: 'root'
})
export class EditProfileService {
  private readonly httpClient = inject(HttpClient);
  private readonly baseUrl = '/api/Profile';

  readonly saveStatus = signal<SaveStatus>('idle');
  readonly saveMessage = signal<string | null>(null);

  load(): Observable<EditProfileForm> {
    return this.httpClient
      .get<ProfileViewModel>(`${this.baseUrl}/me`)
      .pipe(map((profile) => this.mapProfileToForm(profile)));
  }

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

  resetStatus(): void {
    this.saveStatus.set('idle');
    this.saveMessage.set(null);
  }

  private mapProfileToForm(profile: ProfileViewModel): EditProfileForm {
    return {
      displayName: profile.name ?? '',
      username: profile.handle ?? '',
      bio: profile.bio ?? '',
      location: profile.location ?? '',
      website: profile.website ?? '',
      interests: profile.interests ?? [],
      avatarUrl: null,
    };
  }
}
