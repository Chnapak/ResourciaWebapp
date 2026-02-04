import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { Router } from '@angular/router';
import { CreateResourceRequestModel } from '../models/create-resource-request';
import { CreateResourceResponseModel } from '../models/create-resource-response';


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
}
