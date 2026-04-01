/**
 * API client for subject taxonomy data.
 */
import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { SubjectSimple } from '../../shared/models/subject-simple';
import { Observable } from 'rxjs';

/**
 * Service wrapper for subject-related endpoints.
 */
@Injectable({
  providedIn: 'root'
})
export class SubjectService {

  /** Creates the subject service with HTTP access. */
  constructor(private http: HttpClient) { }

  /** Base API path for subject endpoints. */
  protected readonly baseUrl = "/api/Subject"

  /** Retrieves all subjects for search and filtering. */
  getSubjects(): Observable<SubjectSimple[]>{
    const url = this.baseUrl + "/GetAll"
    return this.http.get<SubjectSimple[]>(url);
  }
}
