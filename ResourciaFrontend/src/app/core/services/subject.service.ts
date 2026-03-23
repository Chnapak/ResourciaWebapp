import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { SubjectSimple } from '../../shared/models/subject-simple';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class SubjectService {

  constructor(private http: HttpClient) { }

  protected readonly baseUrl = "/api/Subject"

  getSubjects(): Observable<SubjectSimple[]>{
    const url = this.baseUrl + "/GetAll"
    return this.http.get<SubjectSimple[]>(url);
  }
}
