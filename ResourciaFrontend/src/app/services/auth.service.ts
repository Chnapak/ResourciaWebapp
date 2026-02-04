import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable, ReplaySubject } from 'rxjs';
import { RegisterModel } from '../models/register';
import { MeInfoModel } from '../models/me-info';
import { map, tap } from 'rxjs/operators';
import { LoginModel } from '../models/login';
import { Router } from '@angular/router';
import { ResendConfirmationModel } from '../models/resend-confirmation';


@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private baseUrl = "/api/Auth";
  private readonly router = inject(Router);
  private isLoggedInSubject = new ReplaySubject<boolean>(1);
  private readonly httpClient = inject(HttpClient);

  constructor(){
    const token = localStorage.getItem('accessToken');
    if (token) {
      this.isLoggedInSubject.next(true);  // User is authenticated
    } else {
      this.isLoggedInSubject.next(false);  // User is not authenticated
    }
  }

  getToken(): string | null {
    return localStorage.getItem('accessToken');
  }

  register(data: RegisterModel): Observable<any> {
    console.log("Registration sent");
    const url = this.baseUrl + "/Register"
    return this.httpClient.post<any>(url, data).pipe(
      tap((response) => {
        console.log('Registration successful', response);
      })
    )
  }

  resendEmail(data: ResendConfirmationModel): Observable<any> {
    const url = this.baseUrl + "/ResendEmail"
    return this.httpClient.post<any>(url, data).pipe(
      tap((response) => {
        console.log(response)
      })
    )
  }

  confirmToken(token: string, email: string) {
    const url = this.baseUrl + "/ValidateToken"
    let data = {token, email};
    return this.httpClient.post<any>(url, data).pipe(
      tap((response) => {
        console.log(response)
      })
    )
  }

  login(data: LoginModel): Observable<any> {
    const url = this.baseUrl + "/Login"
    return this.httpClient.post<any>(url, data).pipe(
      tap((response) => {
        const token = response.token;
        localStorage.setItem('accessToken', token);

        this.router.navigate(['/']);
      })
    )
  }

  logout():void {
    const url = this.baseUrl + "/Logout"
    this.httpClient
      .post(url, {})
      .subscribe(() => {
        localStorage.removeItem('accessToken');
        this.isLoggedInSubject.next(false);
        this.router.navigate(['/login']);
      });
  }


  refreshToken(): Observable<string> {
    return this.httpClient
      .post<{ Token: string }>(
        `${this.baseUrl}/RefreshToken`, 
        {})
        .pipe(
        map((response) => {
          console.log(response)
          const newAccessToken = response.Token;
          console.log(newAccessToken)
          localStorage.setItem('accessToken', newAccessToken);
          return newAccessToken;
        })
      );
  }



  getUserInfo(): Observable<MeInfoModel> {
    const url = this.baseUrl + "/UserInfo"
    const token = this.getToken();

    return this.httpClient
    .get<MeInfoModel>(url)
    .pipe(
      map((user: MeInfoModel) => {
        return user; // same pattern as your refreshToken()
      })
    );
  }


}
