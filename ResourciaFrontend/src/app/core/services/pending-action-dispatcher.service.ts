/**
 * Dispatcher that replays deferred actions after authentication completes.
 */
import { Injectable } from '@angular/core';
import { PendingAction } from '../auth/auth.service';

/**
 * Maps pending action types (set before an auth modal opens) to service calls
 * that should be replayed after successful login.
 *
 * Add new action types here as features are built out.
 */
@Injectable({ providedIn: 'root' })
export class PendingActionDispatcher {

  /**
   * Attempts to dispatch a pending action and returns true if handled.
   */
  dispatch(action: PendingAction): boolean {
    switch (action.type) {
      case 'SUBMIT_REVIEW':
        // Will be wired to ReviewService when implemented
        this.replayReview(action.payload);
        return true;

      case 'VOTE_REVIEW':
        this.replayVote(action.payload);
        return true;

      case 'ADD_COMMENT':
        this.replayComment(action.payload);
        return true;

      case 'SUBMIT_RESOURCE':
        this.replaySubmitResource(action.payload);
        return true;

      default:
        return false;
    }
  }

  private replayReview(_payload: unknown): void {}

  private replayVote(_payload: unknown): void {}

  private replayComment(_payload: unknown): void {}

  private replaySubmitResource(_payload: unknown): void {}
}
