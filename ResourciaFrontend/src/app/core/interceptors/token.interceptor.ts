import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { AuthService } from '../auth/auth.service';
import { catchError, switchMap, throwError } from 'rxjs';

export const tokenInterceptor: HttpInterceptorFn = (req, next) => {
  const authService = inject(AuthService);
  
  if (req.url.includes('/login')) {
    return next(req);
  }
  
  const token = localStorage.getItem("accessToken");

  req = req.clone({
    setHeaders: {
      Authorization: `Bearer ${token}`,
    },
  })
  return next(req).pipe(
    catchError((error) => {
      if (error.status === 401 && !req.url.includes('Auth/Refresh') && error.error?.error !== "USER_LOCKED_OUT") {
        return authService.refreshToken().pipe(
          switchMap((newToken: string) => {
            const clonedRequest = req.clone({
              setHeaders: {
                Authorization: `Bearer ${newToken}`,
              },
            });
            console.log(clonedRequest);
            return next(clonedRequest);
          })
        );
      }
        return throwError(() => error);
      }
    )
  )
};
