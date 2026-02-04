import { inject } from '@angular/core';
import { ActivatedRouteSnapshot, CanActivateFn, RouterStateSnapshot } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { map } from 'rxjs';

export const canActivateAdminGuard: CanActivateFn = (
  route: ActivatedRouteSnapshot, 
  state: RouterStateSnapshot
) => {
  const authService = inject(AuthService);

  return authService.getUserInfo().pipe(
    map(user => {
      console.log('isAdmin', user.isAdmin);
      return user.isAdmin;
    })
  );

};