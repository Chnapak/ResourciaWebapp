/**
 * API client for search schema metadata.
 */
import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { SchemaResponse } from '../../shared/models/search-schema';
import { map } from 'rxjs/operators';

/**
 * Service wrapper for search-related endpoints.
 */
@Injectable({
  providedIn: 'root'
})
export class SearchService {
  /** Creates the search service with HTTP access. */
  constructor(private httpClient: HttpClient) {}

  /** Base API path for search endpoints. */
  protected readonly baseUrl = "/api/Search";

  /** Retrieves the search schema used to drive filters. */
  schema(): Observable<SchemaResponse> {
    const url = this.baseUrl + "/Schema"
    return this.httpClient
        .get<SchemaResponse>(url)
        .pipe(
          map((schema: SchemaResponse) => {
            return schema;
          })
    );
  }
}
