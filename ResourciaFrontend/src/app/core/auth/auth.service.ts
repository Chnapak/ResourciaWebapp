import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { BehaviorSubject, Observable, ReplaySubject } from 'rxjs';
import { RegisterModel } from '../../features/auth/models/register';
import { MeInfoModel } from '../../shared/models/me-info';
import { map, tap } from 'rxjs/operators';
import { LoginModel } from '../../features/auth/models/login';
import { Router } from '@angular/router';
import { ResendConfirmationModel } from '../../features/auth/models/resend-confirmation';
import { ResetPasswordModel } from '../../features/auth/models/reset-password';
import { ForgotPasswordModel } from '../../features/auth/models/forgot-password';


@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private baseUrl = "/api/Auth";
  private readonly router = inject(Router);
  private isLoggedInSubject = new BehaviorSubject<boolean>(this.hasToken());
  public readonly isLoggedIn$ = this.isLoggedInSubject.asObservable();
  private readonly httpClient = inject(HttpClient);
  private pendingAction: { type: string; payload?: any } | null = null;

  constructor(){
    const token = localStorage.getItem('accessToken');
    if (token) {
      this.isLoggedInSubject.next(true);  // User is authenticated
    } else {
      this.isLoggedInSubject.next(false);  // User is not authenticated
    }
  }

  initAuth(): Promise<void> {
    const token = this.getToken();

    if (!token) {
      this.isLoggedInSubject.next(false);
      return Promise.resolve();
    }

    return this.httpClient
      .get<MeInfoModel>(`${this.baseUrl}/UserInfo`)
      .toPromise()
      .then(() => {
        this.isLoggedInSubject.next(true);
      })
      .catch(() => {
        localStorage.removeItem('accessToken');
        this.isLoggedInSubject.next(false);
      });
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
        this.isLoggedInSubject.next(true); 
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
          const newAccessToken = response.Token;
          localStorage.setItem('accessToken', newAccessToken);
          this.isLoggedInSubject.next(true);
          return newAccessToken;
        })
      );
  }

  forgotPassword(data: ForgotPasswordModel): Observable<any> {
    const url = this.baseUrl + "/ForgotPassword"

    return this.httpClient.post<any>(url, data).pipe(
      tap((response) => {
        console.log(response)
      })
    )
  }

  resetPassword(data: ResetPasswordModel): Observable<any> {
    const url = this.baseUrl + "/ResetPassword"

    return this.httpClient.post<any>(url, data).pipe(
      tap((response) => {
        console.log(response)
      })
    ) 
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

  private hasToken(): boolean {
    const token = localStorage.getItem('accessToken');
    if (!token) return false;

    return !this.isTokenExpired(token);
  }

  private isTokenExpired(token: string): boolean {
    const payload = JSON.parse(atob(token.split('.')[1]));
    const exp = payload.exp;

    const now = Math.floor(Date.now() / 1000);

    return exp < now;
  }

  requireAuth(action?: { type: string; payload?: any }): boolean {
    if (this.hasToken()) return true;

    if (action) {
      this.setPendingAction(action);
    }

    this.router.navigate(['/login'], {
      queryParams: {
        returnUrl: this.router.url
      }
    });

    return false;
  }

  setPendingAction(action: { type: string; payload?: any }): void {
    this.pendingAction = action;
    console.log(this.pendingAction)
  }

  runPendingAction(): { type: string; payload?: any } | null {
    const action = this.pendingAction;
    this.pendingAction = null;
    console.log(action)
    return action;
  }

  sendReview(resourceId: string) {
    
  }
}
