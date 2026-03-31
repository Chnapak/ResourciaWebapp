import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { BehaviorSubject, Observable, Subject } from 'rxjs';
import { RegisterModel } from '../../features/auth/models/register';
import { MeInfoModel } from '../../shared/models/me-info';
import { map, tap } from 'rxjs/operators';
import { LoginModel } from '../../features/auth/models/login';
import { Router } from '@angular/router';
import { ResendConfirmationModel } from '../../features/auth/models/resend-confirmation';
import { ResetPasswordModel } from '../../features/auth/models/reset-password';
import { ForgotPasswordModel } from '../../features/auth/models/forgot-password';
import { jwtDecode } from 'jwt-decode';
import { JwtPayloadModel } from '../../shared/models/jwt-payload-model';
import { ToasterService } from '../../shared/toaster/toaster.service';
import { CompleteExternalLoginModel } from '../../shared/models/complete-external-login';
<<<<<<< HEAD
=======
import { Review } from '../../shared/models/review';
>>>>>>> rescue-mission

export type AuthState = 'initialising' | 'anonymous' | 'authenticated' | 'token_expired';

export interface PendingAction {
  type: string;
  payload?: any;
}

/** Routes that require auth end-to-end — always hard-redirect, never modal */
const HARD_GATED_ROUTES = ['/profile', '/admin'];

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private readonly baseUrl = '/api/Auth';
  private readonly router = inject(Router);
  private readonly httpClient = inject(HttpClient);

  // ── Auth state ───────────────────────────────────────────────────────────
  private readonly toaster = inject(ToasterService);

  private readonly authStateSubject = new BehaviorSubject<AuthState>('initialising');
  public readonly authState$ = this.authStateSubject.asObservable();

  /** Backward-compatible convenience stream */
  public readonly isLoggedIn$ = this.authState$.pipe(map(s => s === 'authenticated'));

  // ── Current user (decoded from JWT after successful initAuth) ────────────
  private readonly currentUserSubject = new BehaviorSubject<JwtPayloadModel | null>(null);
  public readonly currentUser$ = this.currentUserSubject.asObservable();

  // ── Auth modal trigger ───────────────────────────────────────────────────
  private readonly openAuthModalSubject = new Subject<PendingAction | undefined>();
  public readonly openAuthModal$ = this.openAuthModalSubject.asObservable();

  // ── Pending action ───────────────────────────────────────────────────────
  private pendingAction: PendingAction | null = null;

  // ── Proactive refresh timer ──────────────────────────────────────────────
  private refreshTimer: ReturnType<typeof setTimeout> | null = null;

  // ────────────────────────────────────────────────────────────────────────
  constructor() {
    // Emit an initial conservative state from localStorage so the guard
    // works synchronously before initAuth() resolves.
    const token = localStorage.getItem('accessToken');
    if (token && !this.isTokenExpired(token)) {
      const user = this.decodeToken(token);
      this.currentUserSubject.next(user);
      // Still 'initialising' until server confirms — avoids false positives
    }
  }

  // ── APP_INITIALIZER ──────────────────────────────────────────────────────
  initAuth(): Promise<void> {
    this.authStateSubject.next('initialising');
    const token = this.getToken();

    if (!token || this.isTokenExpired(token)) {
      localStorage.removeItem('accessToken');
      this.authStateSubject.next('anonymous');
      this.currentUserSubject.next(null);
      return Promise.resolve();
    }

    return this.httpClient
      .get<MeInfoModel>(`${this.baseUrl}/UserInfo`)
      .toPromise()
      .then(() => {
        const decoded = this.decodeToken(token);
        this.currentUserSubject.next(decoded);
        this.authStateSubject.next('authenticated');
        this.scheduleProactiveRefresh(token);
      })
      .catch(() => {
        // Server rejected the token — try a silent refresh
        return this.httpClient
          .post<{ Token: string }>(`${this.baseUrl}/RefreshToken`, {})
          .toPromise()
          .then(response => {
            const newToken = response!.Token;
            localStorage.setItem('accessToken', newToken);
            const decoded = this.decodeToken(newToken);
            this.currentUserSubject.next(decoded);
            this.authStateSubject.next('authenticated');
            this.scheduleProactiveRefresh(newToken);
          })
          .catch(() => {
            localStorage.removeItem('accessToken');
            this.authStateSubject.next('anonymous');
            this.currentUserSubject.next(null);
          });
      });
  }

  // ── Token access ─────────────────────────────────────────────────────────
  getToken(): string | null {
    return localStorage.getItem('accessToken');
  }

  isLoggedIn(): boolean {
    return this.authStateSubject.value === 'authenticated';
  }

  get currentState(): AuthState {
    return this.authStateSubject.value;
  }

  updateCurrentUserName(name: string): void {
    const currentUser = this.currentUserSubject.value;
    if (!currentUser) {
      return;
    }

    this.currentUserSubject.next({
      ...currentUser,
      name,
    });
  }

  // ── Login ────────────────────────────────────────────────────────────────
  login(data: LoginModel): Observable<any> {
    return this.httpClient.post<any>(`${this.baseUrl}/Login`, data).pipe(
      tap(response => {
        const token = response.token ?? response.Token;
        this.establishAuthenticatedSession(token);
      })
    );
  }

  // ── Logout ───────────────────────────────────────────────────────────────
  logout(): void {
    const wasOnGatedRoute = HARD_GATED_ROUTES.some(r => this.router.url.startsWith(r));
    this.httpClient.post(`${this.baseUrl}/Logout`, {}).subscribe({
      complete: () => this.doLogout(wasOnGatedRoute),
      error: () => this.doLogout(wasOnGatedRoute)
    });
  }

  private doLogout(wasOnGatedRoute: boolean): void {
    this.clearRefreshTimer();
    localStorage.removeItem('accessToken');
    this.currentUserSubject.next(null);
    this.authStateSubject.next('anonymous');
    this.toaster.show("You've been signed out.", 'info');

    if (wasOnGatedRoute) {
      this.router.navigate(['/auth'], { queryParams: { mode: 'login' }, replaceUrl: true });
    } else {
      this.router.navigate(['/'], { replaceUrl: true });
    }
  }

  handleAccountDeleted(): void {
    this.clearRefreshTimer();
    localStorage.removeItem('accessToken');
    localStorage.removeItem('pendingAction');
    sessionStorage.removeItem('returnUrl');
    this.currentUserSubject.next(null);
    this.authStateSubject.next('anonymous');
    this.toaster.show('Your account has been deleted.', 'info');
    this.router.navigate(['/'], { replaceUrl: true });
  }

  // ── Session expired (refresh token dead) ─────────────────────────────────
  handleSessionExpired(): void {
    this.clearRefreshTimer();
    localStorage.removeItem('accessToken');
    this.currentUserSubject.next(null);
    this.authStateSubject.next('anonymous');

    const isOnGatedRoute = HARD_GATED_ROUTES.some(r => this.router.url.startsWith(r));

    this.toaster.show('Your session expired. Sign in again to continue.', 'info');

    if (isOnGatedRoute) {
      sessionStorage.setItem('returnUrl', this.router.url);
      this.router.navigate(['/auth'], { queryParams: { mode: 'login', returnUrl: this.router.url } });
    } else {
      this.openAuthModalSubject.next(undefined);
    }
  }

  // ── Auth modal ───────────────────────────────────────────────────────────
  openAuthModal(returnAction?: PendingAction): void {
    if (returnAction) {
      this.setPendingAction(returnAction);
    }
    this.openAuthModalSubject.next(returnAction);
  }

  // ── Require auth (replaces old requireAuth) ──────────────────────────────
  requireAuth(action?: PendingAction): boolean {
    if (this.isLoggedIn()) return true;

    if (action) {
      this.setPendingAction(action);
    }

    const isHardGated = HARD_GATED_ROUTES.some(r => this.router.url.startsWith(r));
    if (isHardGated) {
      sessionStorage.setItem('returnUrl', this.router.url);
      this.router.navigate(['/login'], { queryParams: { mode: 'login', returnUrl: this.router.url } });
    } else {
      this.openAuthModalSubject.next(action);
    }

    return false;
  }

  // ── returnUrl helpers ────────────────────────────────────────────────────
  consumeReturnUrl(queryParamReturnUrl?: string): string {
    const stored = sessionStorage.getItem('returnUrl');
    sessionStorage.removeItem('returnUrl');
    return stored ?? queryParamReturnUrl ?? '/';
  }

  // ── Token refresh ────────────────────────────────────────────────────────
  refreshToken(): Observable<string> {
    return this.httpClient
      .post<{ Token: string }>(`${this.baseUrl}/RefreshToken`, {})
      .pipe(
        map(response => {
          const newToken = response.Token;
          this.establishAuthenticatedSession(newToken);
          return newToken;
        })
      );
  }

  private scheduleProactiveRefresh(token: string): void {
    this.clearRefreshTimer();
    try {
      const payload = jwtDecode<{ exp: number }>(token);
      const expiresInMs = (payload.exp * 1000) - Date.now();
      const refreshInMs = Math.max(expiresInMs - 60_000, 0); // 60 s before expiry

      this.refreshTimer = setTimeout(() => {
        this.authStateSubject.next('token_expired');
        this.refreshToken().subscribe({
          error: () => this.handleSessionExpired()
        });
      }, refreshInMs);
    } catch {
      // Bad token — leave it to the interceptor to catch 401s
    }
  }

  private clearRefreshTimer(): void {
    if (this.refreshTimer !== null) {
      clearTimeout(this.refreshTimer);
      this.refreshTimer = null;
    }
  }

  // ── Auth methods ──────────────────────────────────────────────────────────
  register(data: RegisterModel): Observable<any> {
    return this.httpClient.post<any>(`${this.baseUrl}/Register`, data);
  }

  resendEmail(data: ResendConfirmationModel): Observable<any> {
    return this.httpClient.post<any>(`${this.baseUrl}/ResendEmail`, data);
  }

  confirmToken(token: string, email: string): Observable<any> {
    return this.httpClient.post<any>(`${this.baseUrl}/ValidateToken`, { token, email }).pipe(
      tap(response => {
        const confirmedToken = response?.token ?? response?.Token;
        if (confirmedToken) {
          this.establishAuthenticatedSession(confirmedToken);
        }
      })
    );
  }

  forgotPassword(data: ForgotPasswordModel): Observable<any> {
    return this.httpClient.post<any>(`${this.baseUrl}/ForgotPassword`, data);
  }

  resetPassword(data: ResetPasswordModel): Observable<any> {
    return this.httpClient.post<any>(`${this.baseUrl}/ResetPassword`, data);
  }

  getUserInfo(): Observable<MeInfoModel> {
    return this.httpClient.get<MeInfoModel>(`${this.baseUrl}/UserInfo`).pipe(
      map(user => user)
    );
  }

  completeExternalLogin(data: CompleteExternalLoginModel): Observable<any> {
    // This sends the additional profile data to your backend
    // Your backend should identify the user via their existing session/token
    return this.httpClient.post(`${this.baseUrl}/CompleteExternalLogin`, data);
  }

  // ── Pending actions ──────────────────────────────────────────────────────
  setPendingAction(action: PendingAction) {
    this.pendingAction = action;
    localStorage.setItem('pendingAction', JSON.stringify(action));
  }

  peekPendingAction(): PendingAction | null {
    if (this.pendingAction) return this.pendingAction;

    const stored = localStorage.getItem('pendingAction');
    if (!stored) return null;

    this.pendingAction = JSON.parse(stored);
    return this.pendingAction;
  }

  runPendingAction(): PendingAction | null {
    const action = this.peekPendingAction();
    this.pendingAction = null;
    console.log('Running pending action:', action);
    localStorage.removeItem('pendingAction');
    return action;
  }

  // ── Helpers ───────────────────────────────────────────────────────────────
  private isTokenExpired(token: string): boolean {
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      return payload.exp < Math.floor(Date.now() / 1000);
    } catch {
      return true;
    }
  }

  public establishAuthenticatedSession(token: string): void {
    localStorage.setItem('accessToken', token);
    const decoded = this.decodeToken(token);
    this.currentUserSubject.next(decoded);
    this.authStateSubject.next('authenticated');
    this.scheduleProactiveRefresh(token);
  }

  private decodeToken(token: string): JwtPayloadModel | null {
    try {
      const payload = jwtDecode<any>(token);
      const roles: string[] =
        payload['http://schemas.microsoft.com/ws/2008/06/identity/claims/role'] ?? [];
      return {
        id: payload.sub,
        email: payload.email,
        name: payload.name,
        exp: payload.exp,
        isAdmin: roles.includes('Admin'),
        'http://schemas.microsoft.com/ws/2008/06/identity/claims/role': roles,
      } satisfies JwtPayloadModel;
    } catch {
      return null;
    }
  }

}
