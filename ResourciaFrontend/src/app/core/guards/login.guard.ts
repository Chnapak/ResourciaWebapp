import { inject } from '@angular/core';
import { ActivatedRouteSnapshot, CanActivateFn, Router, RouterStateSnapshot } from '@angular/router';
import { AuthService } from '../auth/auth.service';

/** Hard-gates routes that require a logged-in user (profile, etc.).
 *  The resource page is intentionally NOT guarded here — actions within it
 *  are soft-gated inline via AuthGateComponent / authService.requireAuth(). */
export const canActivateGuard: CanActivateFn = (
  _route: ActivatedRouteSnapshot,
  state: RouterStateSnapshot
) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  const isPublic = _route.data?.['public'];

  // ✅ allow public routes always
  if (isPublic) {
    return true;
  }

  // ✅ allow if logged in
  if (authService.isLoggedIn()) {
    return true;
  }

  // ❌ otherwise redirect to login
  return router.createUrlTree(['/login'], {
    queryParams: {
      mode: 'login',
      returnUrl: state.url
    }
  });
};
