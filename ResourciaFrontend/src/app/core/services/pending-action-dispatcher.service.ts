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

  /** Attempt to dispatch a pending action. Returns true if handled. */
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

  private replayReview(payload: any): void {
    // TODO: inject and call ReviewService.submitReview(payload) when implemented
    console.info('[PendingActionDispatcher] Would replay SUBMIT_REVIEW:', payload);
  }

  private replayVote(payload: any): void {
    // TODO: inject and call ReviewService.voteReview(payload) when implemented
    console.info('[PendingActionDispatcher] Would replay VOTE_REVIEW:', payload);
  }

  private replayComment(payload: any): void {
    // TODO: inject and call DiscussionService.addComment(payload) when implemented
    console.info('[PendingActionDispatcher] Would replay ADD_COMMENT:', payload);
  }

  private replaySubmitResource(payload: any): void {
    // TODO: inject and call ResourceService.createResource(payload) when implemented
    console.info('[PendingActionDispatcher] Would replay SUBMIT_RESOURCE:', payload);
  }
}
