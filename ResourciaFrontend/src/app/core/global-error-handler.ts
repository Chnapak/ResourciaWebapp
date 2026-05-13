import { ErrorHandler, inject, Injectable, Injector } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { ToasterService } from '../shared/toaster/toaster.service';

@Injectable()
export class GlobalErrorHandler implements ErrorHandler {
  // Lazy via Injector — ErrorHandler is instantiated before the full DI
  // tree is ready, so direct injection in the constructor can fail.
  private injector = inject(Injector);

  handleError(error: unknown): void {
    // HTTP errors are already handled by the error interceptor.
    if (error instanceof HttpErrorResponse) {
      return;
    }

    console.error('Unhandled error:', error);

    try {
      this.injector.get(ToasterService).show('An unexpected error occurred.', 'error');
    } catch {
      // DI not ready yet — nothing to do
    }
  }
}
