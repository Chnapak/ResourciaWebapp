import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { AdminFilter } from '../../features/admin/models/admin-filter.model';
import { AdminUser } from '../../features/admin/models/admin-user.model';
import { ModerationModel } from '../../shared/models/moderation-model';
import { AdminFilterReorderModel } from '../../features/admin/models/admin-filter-reorder.model';
import { FilterActivityModel } from '../../shared/models/filter-activity-model';
import { AdminFilterUpdateModel } from '../../features/admin/models/admin-filter-update.model';
import { AdminFilterCreateModel } from '../../features/admin/models/admin-filter-create.model';

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

  reorderFilters(filterIds: AdminFilterReorderModel): Observable<void> {
    const url = this.baseUrl + "/filters/reorder"
    return this.httpClient.patch<void>(url, filterIds)
  }

  toggleActiveFilters(filterId: string): Observable<FilterActivityModel> {
    const url = this.baseUrl + "/filters/" + filterId + "/toggleActivity"
    return this.httpClient.patch<FilterActivityModel>(url, { })
  }

  createFilter(request: AdminFilterCreateModel): Observable<AdminFilter> {
    const url = this.baseUrl + "/filters";
    return this.httpClient.post<AdminFilter>(url, request);
  }

  updateFilter(filterId: string, request: AdminFilterUpdateModel): Observable<AdminFilter> {
    const url = this.baseUrl + "/filters/" + filterId;
    return this.httpClient.put<AdminFilter>(url, request);
  }
}
