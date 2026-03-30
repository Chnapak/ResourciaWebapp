import { Injectable, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of, throwError } from 'rxjs';
import { catchError, tap, delay } from 'rxjs/operators';
import { EditProfileForm, SaveStatus } from '../models/edit-profile.model';

/**
 * EditProfileService
 *
 * Currently provides a clean seam for profile editing.
 * Most fields are not yet persisted by the backend — those saves are
 * stubbed here and clearly marked. Wire up real endpoints as they become available.
 */
@Injectable({ providedIn: 'root' })
export class EditProfileService {
  private readonly http = inject(HttpClient);
  private readonly apiBase = '/api';

  readonly saveStatus = signal<SaveStatus>('idle');
  readonly saveError = signal<string | null>(null);

  /**
   * Save the profile form.
   *
   * Currently: only displayName / username changes would map to backend fields.
   * Bio, location, website, interests are future fields — we optimistically
   * pretend to save them locally but do NOT send them to the backend.
   *
   * When a real PATCH /api/Profile endpoint is ready, replace the stub below.
   */
  save(form: EditProfileForm): Observable<void> {
    this.saveStatus.set('saving');
    this.saveError.set(null);

    // -----------------------------------------------------------------------
    // 🔜 FUTURE: Replace this stub with a real PATCH /api/Profile call.
    //    Example:
    //    return this.http.patch<void>(`${this.apiBase}/Profile`, {
    //      displayName: form.displayName,
    //      username:    form.username,
    //      bio:         form.bio,
    //      location:    form.location,
    //      website:     form.website,
    //      interests:   form.interests,
    //    }).pipe(
    //      tap(() => this.saveStatus.set('saved')),
    //      catchError(err => {
    //        this.saveStatus.set('error');
    //        this.saveError.set(err?.error?.message ?? 'Something went wrong.');
    //        return throwError(() => err);
    //      })
    //    );
    // -----------------------------------------------------------------------

    // STUB: simulate network latency, always succeeds
    return of(undefined).pipe(
      delay(900),
      tap(() => this.saveStatus.set('saved')),
      catchError(err => {
        this.saveStatus.set('error');
        this.saveError.set('Could not save profile. Please try again.');
        return throwError(() => err);
      })
    );
  }

  resetStatus(): void {
    this.saveStatus.set('idle');
    this.saveError.set(null);
  }
}
