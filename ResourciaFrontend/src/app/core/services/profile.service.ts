import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ProfileViewModel } from '../../features/profile/models/profile.model';

@Injectable({
  providedIn: 'root'
})
export class ProfileService {
  private readonly baseUrl = '/api/Profile';

  constructor(private httpClient: HttpClient) {}

  getProfile(identifier: string): Observable<ProfileViewModel> {
    return this.httpClient.get<ProfileViewModel>(`${this.baseUrl}/${encodeURIComponent(identifier)}`);
  }
}
