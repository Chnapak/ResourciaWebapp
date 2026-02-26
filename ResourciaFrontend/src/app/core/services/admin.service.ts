import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { AdminFilter } from '../../features/admin/models/admin-filter.model';
import { AdminUser } from '../../features/admin/models/admin-user.model';
import { ModerationModel } from '../../shared/models/moderation-model';

@Injectable({
  providedIn: 'root'
})
export class AdminService {

  constructor(private httpClient: HttpClient) { }

  protected readonly baseUrl = "/api/admin";

  getFilters(): Observable<AdminFilter[]> {
    const url = this.baseUrl + "/filters"
    return this.httpClient.get<AdminFilter[]>(url)
  }

  getUsers(): Observable<AdminUser[]> {
    const url = this.baseUrl + "/users"
    return this.httpClient.get<AdminUser[]>(url)
  }

  suspendUser(userId: string, moderationRequest: ModerationModel): Observable<void> {
    const url = this.baseUrl + "/users/" + userId + "/suspend"
    return this.httpClient.post<void>(url, moderationRequest)
  }

  unsuspendUser(userId: string): Observable<void> {
    const url = this.baseUrl + "/users/" + userId + "/unsuspend"
    return this.httpClient.post<void>(url, {  })
  }

  banUser(userId: string, moderationRequest: ModerationModel): Observable<void> {
    const url = this.baseUrl + "/users/" + userId + "/ban"
    return this.httpClient.post<void>(url, moderationRequest)
  }

  unbanUser(userId: string): Observable<void> {
    const url = this.baseUrl + "/users/" + userId + "/unban"
    return this.httpClient.post<void>(url, {  })
  }
}
