/**
 * Admin API client for filters, users, and resource moderation actions.
 */
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
import {
  ResourceAuditEntryDetail,
  ResourceAuditEntryListResponse,
  ResourceRevertRequest
} from '../../features/admin/models/resource-audit.model';
import { BetaInvite, BetaInviteListResponse } from '../../features/admin/models/beta-invite.model';

/**
 * Service wrapper for admin-only backend endpoints.
 */
@Injectable({
  providedIn: 'root'
})
export class AdminService {

  /** Creates the admin service with HTTP access. */
  constructor(private httpClient: HttpClient) { }

  /** Base API path for admin endpoints. */
  protected readonly baseUrl = "/api/admin";

  /** Retrieves all admin-configured filters. */
  getFilters(): Observable<AdminFilter[]> {
    const url = this.baseUrl + "/filters"
    return this.httpClient.get<AdminFilter[]>(url)
  }

  /** Retrieves all users with admin metadata for moderation. */
  getUsers(): Observable<AdminUsersResponse> {
    const url = this.baseUrl + "/users"
    return this.httpClient.get<AdminUsersResponse>(url)
  }

  /** Suspends a user with a moderation reason. */
  suspendUser(userId: string, moderationRequest: ModerationModel): Observable<void> {
    const url = this.baseUrl + "/users/" + userId + "/suspend"
    return this.httpClient.post<void>(url, moderationRequest)
  }

  /** Removes a user's suspension status. */
  unsuspendUser(userId: string): Observable<void> {
    const url = this.baseUrl + "/users/" + userId + "/unsuspend"
    return this.httpClient.post<void>(url, {  })
  }

  /** Bans a user with a moderation reason. */
  banUser(userId: string, moderationRequest: ModerationModel): Observable<void> {
    const url = this.baseUrl + "/users/" + userId + "/ban"
    return this.httpClient.post<void>(url, moderationRequest)
  }

  /** Removes a user's ban status. */
  unbanUser(userId: string): Observable<void> {
    const url = this.baseUrl + "/users/" + userId + "/unban"
    return this.httpClient.post<void>(url, {  })
  }

  /** Persists a new display order for filters. */
  reorderFilters(filterIds: AdminFilterReorderModel): Observable<void> {
    const url = this.baseUrl + "/filters/reorder"
    return this.httpClient.patch<void>(url, filterIds)
  }

  /** Toggles the active status of a filter. */
  toggleActiveFilters(filterId: string): Observable<FilterActivityModel> {
    const url = this.baseUrl + "/filters/" + filterId + "/toggleActivity"
    return this.httpClient.patch<FilterActivityModel>(url, { })
  }

  /** Creates a new filter. */
  createFilter(request: AdminFilterCreateModel): Observable<AdminFilter> {
    const url = this.baseUrl + "/filters";
    return this.httpClient.post<AdminFilter>(url, request);
  }

  /** Updates an existing filter. */
  updateFilter(filterId: string, request: AdminFilterUpdateModel): Observable<AdminFilter> {
    const url = this.baseUrl + "/filters/" + filterId;
    return this.httpClient.put<AdminFilter>(url, request);
  }

  /** Deletes a filter by id. */
  deleteFilter(filterId: string): Observable<void> {
    const url = this.baseUrl + "/filters/" + filterId;
    return this.httpClient.delete<void>(url);
  }

  /** Retrieves paged resources for the admin resource list. */
  getResources(page = 1, pageSize = 25): Observable<{ items: AdminResource[]; totalCount: number; page: number; pageSize: number }> {
    const url = `${this.baseUrl}/resources?page=${page}&pageSize=${pageSize}`;
    return this.httpClient.get<{ items: AdminResource[]; totalCount: number; page: number; pageSize: number }>(url);
  }

  /** Deletes a resource by id. */
  deleteResource(resourceId: string): Observable<void> {
    const url = this.baseUrl + "/resources/" + resourceId;
    return this.httpClient.delete<void>(url);
  }

  /** Restores a soft-deleted resource by id. */
  restoreResource(resourceId: string): Observable<void> {
    const url = this.baseUrl + "/resources/" + resourceId + "/restore";
    return this.httpClient.post<void>(url, {});
  }

  /** Retrieves audit entries for a resource. */
  getResourceAudit(resourceId: string, page = 1, pageSize = 20): Observable<ResourceAuditEntryListResponse> {
    const url = `/api/resources/${resourceId}/audit?page=${page}&pageSize=${pageSize}`;
    return this.httpClient.get<ResourceAuditEntryListResponse>(url);
  }

  /** Retrieves audit entry detail for a resource. */
  getResourceAuditEntry(resourceId: string, auditId: string): Observable<ResourceAuditEntryDetail> {
    const url = `/api/resources/${resourceId}/audit/${auditId}`;
    return this.httpClient.get<ResourceAuditEntryDetail>(url);
  }

  /** Reverts a resource to a specific audit entry. */
  revertResource(resourceId: string, request: ResourceRevertRequest): Observable<void> {
    const url = `/api/resources/${resourceId}/revert`;
    return this.httpClient.post<void>(url, request);
  }

  /** Retrieves closed-beta registration invites. */
  getBetaInvites(): Observable<BetaInviteListResponse> {
    const url = `${this.baseUrl}/beta-invites`;
    return this.httpClient.get<BetaInviteListResponse>(url);
  }

  /** Creates a registration invite for a single email address. */
  createBetaInvite(email: string): Observable<BetaInvite> {
    const url = `${this.baseUrl}/beta-invites`;
    return this.httpClient.post<BetaInvite>(url, { email });
  }

  /** Revokes a pending registration invite. */
  revokeBetaInvite(inviteId: string): Observable<void> {
    const url = `${this.baseUrl}/beta-invites/${inviteId}`;
    return this.httpClient.delete<void>(url);
  }
}
