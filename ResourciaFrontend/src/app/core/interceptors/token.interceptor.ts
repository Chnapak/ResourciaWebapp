/**
 * HTTP interceptor that refreshes access cookies on 401 responses.
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
  Subject,
  catchError,
  Observable,
  switchMap,
  take,
  throwError,
} from 'rxjs';

/** URLs that must not trigger a reactive 401 refresh loop. */
const SKIP_REFRESH_URLS = [
  '/Auth/RefreshToken',
  '/Auth/Login',
  '/Auth/Register',
  '/Auth/ValidateToken',
  '/Auth/ResendEmail',
  '/Auth/ForgotPassword',
  '/Auth/ResetPassword',
];

/** Module-level refresh lock shared across all interceptor calls. */
let isRefreshing = false;
/** Stream that signals a refresh completion to queued requests. */
const refreshToken$ = new Subject<void>();

/**
 * Adds auth tokens to requests and performs a token refresh on 401 responses.
 */
export const tokenInterceptor: HttpInterceptorFn = (
  req: HttpRequest<unknown>,
  next: HttpHandlerFn
): Observable<HttpEvent<unknown>> => {
  const authService = inject(AuthService);

  if (!isSameOriginRequest(req.url)) {
    return next(req);
  }

  return next(req).pipe(
    catchError(error => {
      const is401 = error.status === 401;
      const isRefreshUrl = SKIP_REFRESH_URLS.some(url => req.url.includes(url));
      const isLockedOut = error.error?.error === 'USER_LOCKED_OUT';

      if (!is401 || isRefreshUrl || isLockedOut) {
        return throwError(() => error);
      }

      // ── Serialise concurrent refresh calls ───────────────────────────────
      if (isRefreshing) {
        // Another call is already refreshing — wait for completion
        return refreshToken$.pipe(
          take(1),
          switchMap(() => next(req))
        );
      }

      isRefreshing = true;

      return authService.refreshToken().pipe(
        switchMap(() => {
          isRefreshing = false;
          refreshToken$.next();
          return next(req);
        }),
        catchError(refreshError => {
          isRefreshing = false;
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
function isSameOriginRequest(url: string): boolean {
  if (url.startsWith('/')) {
    return true;
  }

  if (!/^https?:\/\//i.test(url)) {
    return true;
  }

  try {
    if (typeof window === 'undefined') {
      return false;
    }
    const target = new URL(url);
    return target.origin === window.location.origin;
  } catch {
    return false;
  }
}
