import { Injectable, inject } from '@angular/core';
import { AuthService, PendingAction } from '../../core/auth/auth.service';
import { PendingActionDispatcher } from '../../core/services/pending-action-dispatcher.service';

/** Singleton service that controls the global AuthModal visibility.
 *  Components call open() to trigger the modal; the modal itself calls
 *  onLoginSuccess() after authentication completes. */
@Injectable({ providedIn: 'root' })
export class AuthModalService {
  private readonly authService = inject(AuthService);
  private readonly dispatcher = inject(PendingActionDispatcher);

  /** Called by the modal component after a successful login. */
  onLoginSuccess(): void {
    const action = this.authService.runPendingAction();
    if (action) {
      this.dispatcher.dispatch(action);
    }
  }
}
