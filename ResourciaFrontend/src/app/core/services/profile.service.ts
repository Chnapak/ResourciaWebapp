/**
 * API client for fetching public profile data.
 */
import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ProfileViewModel } from '../../features/profile/models/profile.model';

/**
 * Service wrapper for profile-related endpoints.
 */
@Injectable({
  providedIn: 'root'
})
export class ProfileService {
  /** Base API path for profile endpoints. */
  private readonly baseUrl = '/api/Profile';

  /** Creates the profile service with HTTP access. */
  constructor(private httpClient: HttpClient) {}

  /** Fetches a profile by username or identifier. */
  getProfile(identifier: string): Observable<ProfileViewModel> {
    return this.httpClient.get<ProfileViewModel>(`${this.baseUrl}/${encodeURIComponent(identifier)}`);
  }
}
