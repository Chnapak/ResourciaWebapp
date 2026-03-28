import { inject } from '@angular/core';
import { CanMatchFn, Route, Router, UrlSegment } from '@angular/router';
import { AuthService } from '../auth/auth.service';
import { map } from 'rxjs';

/** Guards /admin routes — requires the user to be authenticated and have the Admin role.
 *  Uses getUserInfo() for an authoritative server-side check (not just the local JWT). */
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