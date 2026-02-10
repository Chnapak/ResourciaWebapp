import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { AdminFilter } from '../../features/admin/models/admin-filter.model';
import { AdminUser } from '../../features/admin/models/admin-user.model';

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
}
