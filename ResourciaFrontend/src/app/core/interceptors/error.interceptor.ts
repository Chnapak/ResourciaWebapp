import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { catchError, throwError } from 'rxjs';
import { ToasterService } from '../../shared/toaster/toaster.service';

/**
 * Per-status cooldown so a burst of failing concurrent requests only
 * shows one toast instead of flooding the screen.
 */
const lastToastAt = new Map<number, number>();
const COOLDOWN_MS = 5_000;

function acquireToast(status: number): boolean {
  const now = Date.now();
  if ((now - (lastToastAt.get(status) ?? 0)) > COOLDOWN_MS) {
    lastToastAt.set(status, now);
    return true;
  }
  return false;
}

function messageFor(status: number): string | null {
  if (status === 0)   return 'Connection error — check your internet connection.';
  if (status === 403) return 'You don\'t have permission to do that.';
  if (status === 429) return 'Too many requests — please slow down.';
  if (status >= 500)  return 'Something went wrong on our end. Please try again.';
  // 400 (validation), 401 (auth interceptor), 404 (expected miss) — handled elsewhere
  return null;
}

export const errorInterceptor: HttpInterceptorFn = (req, next) => {
  const toaster = inject(ToasterService);

  return next(req).pipe(
    catchError((error: HttpErrorResponse) => {
      const message = messageFor(error.status);
      if (message && acquireToast(error.status)) {
        toaster.show(message, 'error');
      }
      return throwError(() => error);
    })
  );
};
