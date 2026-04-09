/**
 * Authentication state management, token handling, and auth-related API calls.
 */
import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { BehaviorSubject, Observable, Subject, of } from 'rxjs';
import { RegisterModel } from '../../features/auth/models/register';
import { MeInfoModel } from '../../shared/models/me-info';
import { catchError, map, switchMap, tap } from 'rxjs/operators';
import { LoginModel } from '../../features/auth/models/login';
import { Router } from '@angular/router';
import { ResendConfirmationModel } from '../../features/auth/models/resend-confirmation';
import { ResetPasswordModel } from '../../features/auth/models/reset-password';
import { ForgotPasswordModel } from '../../features/auth/models/forgot-password';
import { ToasterService } from '../../shared/toaster/toaster.service';
import { CompleteExternalLoginModel } from '../../shared/models/complete-external-login';

/**
 * Authentication lifecycle states used across guards and components.
 */
export type AuthState = 'initialising' | 'anonymous' | 'authenticated' | 'token_expired';

/**
 * An action to resume after a successful authentication flow.
 */
export interface PendingAction {
  /** Identifier describing the deferred action. */
  type: string;
  /** Optional payload needed to execute the deferred action. */
  payload?: any;
}

/** Routes that require auth end-to-end — always hard-redirect, never modal. */
const HARD_GATED_ROUTES = ['/profile', '/admin'];

/**
 * Central authentication service coordinating session state and API calls.
 */
@Injectable({
  providedIn: 'root'
})
export class AuthService {
  /** Base API path for authentication endpoints. */
  private readonly baseUrl = '/api/Auth';
  /** Router used for navigation after auth state changes. */
  private readonly router = inject(Router);
  /** HTTP client used for auth-related API calls. */
  private readonly httpClient = inject(HttpClient);

  // ── Auth state ───────────────────────────────────────────────────────────
  /** Toaster used to surface auth notifications to the user. */
  private readonly toaster = inject(ToasterService);

  /** Internal subject that tracks the current authentication state. */
  private readonly authStateSubject = new BehaviorSubject<AuthState>('initialising');
  /** Observable stream of authentication state updates. */
  public readonly authState$ = this.authStateSubject.asObservable();

  /** Convenience stream that emits true when the user is authenticated. */
  public readonly isLoggedIn$ = this.authState$.pipe(map(s => s === 'authenticated'));

  // ── Current user (decoded from JWT after successful initAuth) ────────────
  /** Internal subject with the current user profile. */
  private readonly currentUserSubject = new BehaviorSubject<MeInfoModel | null>(null);
  /** Observable stream of the current user profile. */
  public readonly currentUser$ = this.currentUserSubject.asObservable();

  // ── Auth modal trigger ───────────────────────────────────────────────────
  /** Internal subject used to request the auth modal. */
  private readonly openAuthModalSubject = new Subject<PendingAction | undefined>();
  /** Observable stream that triggers the auth modal to open. */
  public readonly openAuthModal$ = this.openAuthModalSubject.asObservable();

  // ── Pending action ───────────────────────────────────────────────────────
  /** Cached action to resume after successful authentication. */
  private pendingAction: PendingAction | null = null;

  // ────────────────────────────────────────────────────────────────────────
  /** Initializes auth state from any cached access token. */
  constructor() {
  }

  // ── APP_INITIALIZER ──────────────────────────────────────────────────────
  /**
   * Initializes authentication state during app startup.
   */
  initAuth(): Promise<void> {
    this.authStateSubject.next('initialising');
    return this.httpClient
      .get<MeInfoModel>(`${this.baseUrl}/UserInfo`)
      .toPromise()
      .then(user => {
        this.applyUserInfo(user);
      })
      .catch(() => {
        return this.httpClient
          .post<void>(`${this.baseUrl}/RefreshToken`, {})
          .toPromise()
          .then(() => this.httpClient.get<MeInfoModel>(`${this.baseUrl}/UserInfo`).toPromise())
          .then(user => {
            this.applyUserInfo(user);
          })
          .catch(() => {
            this.applyUserInfo(null);
          });
      });
  }

  /** Checks whether the service considers the user authenticated. */
  isLoggedIn(): boolean {
    return this.authStateSubject.value === 'authenticated';
  }

  /** Exposes the current auth state value synchronously. */
  get currentState(): AuthState {
    return this.authStateSubject.value;
  }

  /** Updates the cached current user's display name. */
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
  /** Attempts login and establishes an authenticated session on success. */
  login(data: LoginModel): Observable<MeInfoModel | null> {
    return this.httpClient.post<void>(`${this.baseUrl}/Login`, data).pipe(
      switchMap(() => this.syncUserInfo())
    );
  }

  // ── Logout ───────────────────────────────────────────────────────────────
  /** Logs out the current user and redirects based on the current route. */
  logout(): void {
    const wasOnGatedRoute = HARD_GATED_ROUTES.some(r => this.router.url.startsWith(r));
    this.httpClient.post(`${this.baseUrl}/Logout`, {}).subscribe({
      complete: () => this.doLogout(wasOnGatedRoute),
      error: () => this.doLogout(wasOnGatedRoute)
    });
  }

  /** Performs local logout cleanup and post-logout navigation. */
  private doLogout(wasOnGatedRoute: boolean): void {
    this.currentUserSubject.next(null);
    this.authStateSubject.next('anonymous');
    this.toaster.show("You've been signed out.", 'info');

    if (wasOnGatedRoute) {
      this.router.navigate(['/auth'], { queryParams: { mode: 'login' }, replaceUrl: true });
    } else {
      this.router.navigate(['/'], { replaceUrl: true });
    }
  }

  /** Clears local session state after the account is deleted. */
  handleAccountDeleted(): void {
    this.currentUserSubject.next(null);
    localStorage.removeItem('pendingAction');
    sessionStorage.removeItem('returnUrl');
    this.authStateSubject.next('anonymous');
    this.toaster.show('Your account has been deleted.', 'info');
    this.router.navigate(['/'], { replaceUrl: true });
  }

  // ── Session expired (refresh token dead) ─────────────────────────────────
  /** Handles an expired session and prompts re-authentication if needed. */
  handleSessionExpired(): void {
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
  /** Opens the authentication modal and stores any pending action. */
  openAuthModal(returnAction?: PendingAction): void {
    if (returnAction) {
      this.setPendingAction(returnAction);
    }
    this.openAuthModalSubject.next(returnAction);
  }

  // ── Require auth (replaces old requireAuth) ──────────────────────────────
  /**
   * Ensures the user is authenticated, optionally storing a pending action.
   */
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
  /** Consumes the stored return URL (if any) and clears it. */
  consumeReturnUrl(queryParamReturnUrl?: string): string {
    const stored = sessionStorage.getItem('returnUrl');
    sessionStorage.removeItem('returnUrl');
    return stored ?? queryParamReturnUrl ?? '/';
  }

  // ── Token refresh ────────────────────────────────────────────────────────
  /** Requests a new access token cookie and refreshes the current user profile. */
  refreshToken(): Observable<void> {
    return this.httpClient
      .post<void>(`${this.baseUrl}/RefreshToken`, {})
      .pipe(
        switchMap(() => this.syncUserInfo()),
        map(() => undefined)
      );
  }

  // ── Auth methods ──────────────────────────────────────────────────────────
  /** Registers a new user account. */
  register(data: RegisterModel): Observable<any> {
    return this.httpClient.post<any>(`${this.baseUrl}/Register`, data);
  }

  /** Resends the email confirmation link. */
  resendEmail(data: ResendConfirmationModel): Observable<any> {
    return this.httpClient.post<any>(`${this.baseUrl}/ResendEmail`, data);
  }

  /** Validates a confirmation token and stores the access token if provided. */
  confirmToken(token: string, email: string): Observable<MeInfoModel | null> {
    return this.httpClient
      .post<void>(`${this.baseUrl}/ValidateToken`, { token, email })
      .pipe(switchMap(() => this.syncUserInfo()));
  }

  /** Initiates the forgot password flow. */
  forgotPassword(data: ForgotPasswordModel): Observable<any> {
    return this.httpClient.post<any>(`${this.baseUrl}/ForgotPassword`, data);
  }

  /** Completes the password reset flow. */
  resetPassword(data: ResetPasswordModel): Observable<any> {
    return this.httpClient.post<any>(`${this.baseUrl}/ResetPassword`, data);
  }

  /** Fetches the current user's profile information from the API. */
  getUserInfo(): Observable<MeInfoModel> {
    return this.httpClient.get<MeInfoModel>(`${this.baseUrl}/UserInfo`).pipe(
      map(user => user)
    );
  }

  /** Completes an external login by supplying additional profile data. */
  completeExternalLogin(data: CompleteExternalLoginModel): Observable<any> {
    // This sends the additional profile data to your backend
    // Your backend should identify the user via their existing session/token
    return this.httpClient.post(`${this.baseUrl}/CompleteExternalLogin`, data);
  }

  // ── Pending actions ──────────────────────────────────────────────────────
  /** Stores an action to be executed after authentication completes. */
  setPendingAction(action: PendingAction) {
    this.pendingAction = action;
    localStorage.setItem('pendingAction', JSON.stringify(action));
  }

  /** Returns the pending action without clearing it. */
  peekPendingAction(): PendingAction | null {
    if (this.pendingAction) return this.pendingAction;

    const stored = localStorage.getItem('pendingAction');
    if (!stored) return null;

    this.pendingAction = JSON.parse(stored);
    return this.pendingAction;
  }

  /** Clears and returns the current pending action. */
  runPendingAction(): PendingAction | null {
    const action = this.peekPendingAction();
    this.pendingAction = null;
    console.log('Running pending action:', action);
    localStorage.removeItem('pendingAction');
    return action;
  }

  // ── Helpers ───────────────────────────────────────────────────────────────
  /** Fetches the current user profile and updates auth state. */
  private syncUserInfo(): Observable<MeInfoModel | null> {
    return this.httpClient.get<MeInfoModel>(`${this.baseUrl}/UserInfo`).pipe(
      tap(user => this.applyUserInfo(user)),
      catchError(() => {
        this.applyUserInfo(null);
        return of(null);
      })
    );
  }

  /** Applies user info to local auth state. */
  private applyUserInfo(user: MeInfoModel | null | undefined): void {
    if (!user || !user.isAuthenticated) {
      this.currentUserSubject.next(null);
      this.authStateSubject.next('anonymous');
      return;
    }

    this.currentUserSubject.next(user);
    this.authStateSubject.next('authenticated');
  }

}
