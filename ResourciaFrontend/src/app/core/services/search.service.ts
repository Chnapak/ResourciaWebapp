import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { SchemaResponse } from '../../models/search-schema';
import { map } from 'rxjs/operators';

@Injectable({
  providedIn: 'root'
})
export class SearchService {
  constructor(private httpClient: HttpClient) {}

  protected readonly baseUrl = "/api/Search";

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
