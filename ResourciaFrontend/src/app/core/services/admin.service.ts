import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { AdminFilter } from '../../features/admin/models/admin-filter.model';
import { AdminUsersResponse } from '../../features/admin/models/admin-user.model';
import { ModerationModel } from '../../shared/models/moderation-model';
import { AdminFilterReorderModel } from '../../features/admin/models/admin-filter-reorder.model';
import { FilterActivityModel } from '../../shared/models/filter-activity-model';
import { AdminFilterUpdateModel } from '../../features/admin/models/admin-filter-update.model';
import { AdminFilterCreateModel } from '../../features/admin/models/admin-filter-create.model';
import { AdminResource } from '../../features/admin/models/admin-resource.model';

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

  getUsers(): Observable<AdminUsersResponse> {
    const url = this.baseUrl + "/users"
    return this.httpClient.get<AdminUsersResponse>(url)
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

  deleteFilter(filterId: string): Observable<void> {
    const url = this.baseUrl + "/filters/" + filterId;
    return this.httpClient.delete<void>(url);
  }

  getResources(page = 1, pageSize = 25): Observable<{ items: AdminResource[]; totalCount: number; page: number; pageSize: number }> {
    const url = `${this.baseUrl}/resources?page=${page}&pageSize=${pageSize}`;
    return this.httpClient.get<{ items: AdminResource[]; totalCount: number; page: number; pageSize: number }>(url);
  }

  deleteResource(resourceId: string): Observable<void> {
    const url = this.baseUrl + "/resources/" + resourceId;
    return this.httpClient.delete<void>(url);
  }
}
