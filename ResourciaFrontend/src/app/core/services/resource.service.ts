/**
 * API client for resource creation, search, and save-state operations.
 */
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
import { ResourceImageModel, ResourceImageUploadResponse } from '../../shared/models/resource-image';


/**
 * Service wrapper for resource-related endpoints.
 */
@Injectable({
  providedIn: 'root'
})
export class ResourceService {

  /** Creates the resource service with HTTP access. */
  constructor(private httpClient: HttpClient) 
  { }

  /** Base API path for resource endpoints. */
  protected readonly baseUrl = "/api/resources";

  /** Creates a new resource submission. */
  createResource(payload: CreateResourceRequestModel): Observable<CreateResourceResponseModel> {
    return this.httpClient.post<CreateResourceResponseModel>(this.baseUrl, payload);
  }

  /** Fetches the search schema used to build resource filters. */
  getResourceSchema(): Observable<SchemaResponse> {
    return this.httpClient.get<SchemaResponse>(`${this.baseUrl}/schema`);
  }

  /** Builds HTTP query parameters from a filter object. */
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

  /** Executes a search query for resources. */
  searchResource(query: Record<string, any>): Observable<SearchResponse> {
    const params = this.buildHttpParams(query);
    return this.httpClient.get<SearchResponse>(`${this.baseUrl}/search`, { params });
  }

  /** Fetches a detailed resource by id. */
  getResource(id: string): Observable<ResourceDetailModel> {
    return this.httpClient.get<ResourceDetailModel>(`/api/resources/${id}`);
  }

  /** Fetches images for a resource. */
  getResourceImages(id: string): Observable<ResourceImageModel[]> {
    return this.httpClient.get<ResourceImageModel[]>(`${this.baseUrl}/${id}/images`);
  }

  /** Uploads a single image for a resource. */
  uploadResourceImage(id: string, file: File): Observable<ResourceImageUploadResponse> {
    const formData = new FormData();
    formData.append('file', file);
    return this.httpClient.post<ResourceImageUploadResponse>(`${this.baseUrl}/${id}/images`, formData);
  }

  /** Deletes a resource image by id. */
  deleteResourceImage(imageId: string): Observable<void> {
    return this.httpClient.delete<void>(`${this.baseUrl}/images/${imageId}`);
  }

  /** Retrieves the current user's save state for a resource. */
  getSaveState(id: string): Observable<ResourceSaveStateModel> {
    return this.httpClient.get<ResourceSaveStateModel>(`${this.baseUrl}/${id}/save-state`);
  }

  /** Saves a resource for the current user. */
  saveResource(id: string): Observable<ResourceSaveStateModel> {
    return this.httpClient.post<ResourceSaveStateModel>(`${this.baseUrl}/${id}/save`, {});
  }

  /** Removes a resource from the current user's saved list. */
  unsaveResource(id: string): Observable<ResourceSaveStateModel> {
    return this.httpClient.delete<ResourceSaveStateModel>(`${this.baseUrl}/${id}/save`);
  }
}
