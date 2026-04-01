/**
 * HTTP interceptor that injects access tokens and refreshes on 401 responses.
 */
import {
  HttpEvent,
  HttpHandlerFn,
  HttpInterceptorFn,
  HttpRequest,
} from '@angular/common/http';
import { inject } from '@angular/core';
import { AuthService } from '../auth/auth.service';
import {
  BehaviorSubject,
  catchError,
  filter,
  Observable,
  switchMap,
  take,
  throwError,
} from 'rxjs';

/** URLs that must never have the Authorization header injected. */
const SKIP_AUTH_URLS = ['/Auth/Login', '/Auth/Register'];

/** URLs that must not trigger a reactive 401 refresh loop. */
const SKIP_REFRESH_URLS = ['/Auth/RefreshToken', '/Auth/Login'];

/** Module-level refresh lock shared across all interceptor calls. */
let isRefreshing = false;
/** Stream that broadcasts the most recent refreshed token. */
const refreshToken$ = new BehaviorSubject<string | null>(null);

/**
 * Adds auth tokens to requests and performs a token refresh on 401 responses.
 */
export const tokenInterceptor: HttpInterceptorFn = (
  req: HttpRequest<unknown>,
  next: HttpHandlerFn
): Observable<HttpEvent<unknown>> => {
  const authService = inject(AuthService);

  // Skip auth header injection for public auth endpoints
  if (SKIP_AUTH_URLS.some(url => req.url.includes(url))) {
    return next(req);
  }

  const token = authService.getToken();
  const enriched = token ? addToken(req, token) : req;

  return next(enriched).pipe(
    catchError(error => {
      const is401 = error.status === 401;
      const isRefreshUrl = SKIP_REFRESH_URLS.some(url => req.url.includes(url));
      const isLockedOut = error.error?.error === 'USER_LOCKED_OUT';

      if (!is401 || isRefreshUrl || isLockedOut) {
        return throwError(() => error);
      }

      // ── Serialise concurrent refresh calls ───────────────────────────────
      if (isRefreshing) {
        // Another call is already refreshing — wait for the new token
        return refreshToken$.pipe(
          filter(t => t !== null),
          take(1),
          switchMap(newToken => next(addToken(req, newToken!)))
        );
      }

      isRefreshing = true;
      refreshToken$.next(null);

      return authService.refreshToken().pipe(
        switchMap(newToken => {
          isRefreshing = false;
          refreshToken$.next(newToken);
          return next(addToken(req, newToken));
        }),
        catchError(refreshError => {
          isRefreshing = false;
          refreshToken$.next(null);
          // Refresh token is dead — clean up the session
          authService.handleSessionExpired();
          return throwError(() => refreshError);
        })
      );
    })
  );
};

/**
 * Clones the request with a bearer token header.
 */
function addToken(req: HttpRequest<unknown>, token: string): HttpRequest<unknown> {
  return req.clone({ setHeaders: { Authorization: `Bearer ${token}` } });
}
