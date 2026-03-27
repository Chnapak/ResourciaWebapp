import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, Resource } from '@angular/core';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { Router } from '@angular/router';
import { CreateResourceRequestModel } from '../../shared/models/create-resource-request';
import { CreateResourceResponseModel } from '../../shared/models/create-resource-response';
import { ResourceDetailModel } from '../../shared/models/resource-detail';
import { SearchResponse } from '../../shared/models/search-response';
import { ReviewRequestModel } from '../../shared/models/review-request';


@Injectable({
  providedIn: 'root'
})
export class ResourceService {

  constructor(private httpClient: HttpClient) 
  { }

  protected readonly baseUrl = "/api/Resource";

  createResource(payload: CreateResourceRequestModel): Observable<CreateResourceResponseModel> {
    return this.httpClient.post<CreateResourceResponseModel>(this.baseUrl, payload);
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

  submitReview(id: string, payload: ReviewRequestModel): Observable<void> {
    const body = {
      content: payload.text,
      rating: payload.stars
    };

    return this.httpClient.post<void>(`${this.baseUrl}/${id}/reviews`, body);
  }

  getResource(id: string): Observable<ResourceDetailModel> {
    return this.httpClient.get<ResourceDetailModel>(`/api/Resource/${id}`);
  }
}
