/**
 * Admin-only route guard that verifies server-side admin status.
 */
import { inject } from '@angular/core';
import { CanMatchFn, Route, Router, UrlSegment } from '@angular/router';
import { AuthService } from '../auth/auth.service';
import { map } from 'rxjs';

/**
 * Guards admin routes by requiring an authenticated admin account.
 * Uses `getUserInfo()` to validate the role against the server.
 */
export const canActivateAdminGuard: CanMatchFn = (
  _route: Route,
  _segments: UrlSegment[]
) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  return authService.getUserInfo().pipe(
    map(user => {
      if (user.isAdmin) return true;
      return router.createUrlTree(['/auth'], { queryParams: { mode: 'login' } });
    })
  );
};
