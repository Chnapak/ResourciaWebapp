import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, Resource } from '@angular/core';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { Router } from '@angular/router';
import { CreateResourceRequestModel } from '../../shared/models/create-resource-request';
import { CreateResourceResponseModel } from '../../shared/models/create-resource-response';
import { ResourceDetailModel } from '../../shared/models/resource-detail';
import { ResourceSaveStateModel } from '../../shared/models/resource-save-state';
import { SearchResponse } from '../../shared/models/search-response';
import { ReviewRequestModel } from '../../shared/models/review-request';
import { Review } from '../../shared/models/review';
import { SchemaResponse } from '../../shared/models/search-schema';


@Injectable({
  providedIn: 'root'
})
export class ResourceService {

  constructor(private httpClient: HttpClient) 
  { }

  protected readonly baseUrl = "/api/resources";

  createResource(payload: CreateResourceRequestModel): Observable<CreateResourceResponseModel> {
    return this.httpClient.post<CreateResourceResponseModel>(this.baseUrl, payload);
  }

  getResourceSchema(): Observable<SchemaResponse> {
    return this.httpClient.get<SchemaResponse>(`${this.baseUrl}/schema`);
  }

  private buildHttpParams(query: Record<string, any>): HttpParams {
    let params = new HttpParams();

    for (const key in query) {
      const value = query[key];

      if (Array.isArray(value)) {
        value.forEach(v => {
          params = params.append(key, v);
        });
      } else if (value !== null && value !== undefined) {
        params = params.set(key, value);
      }
    }

    return params;
  }

  searchResource(query: Record<string, any>): Observable<SearchResponse> {
    const params = this.buildHttpParams(query);
    return this.httpClient.get<SearchResponse>(`${this.baseUrl}/search`, { params });
  }

  getResource(id: string): Observable<ResourceDetailModel> {
    return this.httpClient.get<ResourceDetailModel>(`/api/resources/${id}`);
  }

  getSaveState(id: string): Observable<ResourceSaveStateModel> {
    return this.httpClient.get<ResourceSaveStateModel>(`${this.baseUrl}/${id}/save-state`);
  }

  saveResource(id: string): Observable<ResourceSaveStateModel> {
    return this.httpClient.post<ResourceSaveStateModel>(`${this.baseUrl}/${id}/save`, {});
  }

  unsaveResource(id: string): Observable<ResourceSaveStateModel> {
    return this.httpClient.delete<ResourceSaveStateModel>(`${this.baseUrl}/${id}/save`);
  }
}
