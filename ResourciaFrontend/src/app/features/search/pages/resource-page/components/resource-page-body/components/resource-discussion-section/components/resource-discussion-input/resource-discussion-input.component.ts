import { Component, EventEmitter, inject, Input, Output } from '@angular/core';
import { getInitials, getUserGradient } from '../../../../../../../../../../shared/utils/user.utils';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../../../../../../../../../core/auth/auth.service';
import { Router } from '@angular/router';
import { DiscussionService } from '../../../../../../../../../../core/services/discussion.service';

/**
 * Input composer for starting a new discussion thread.
 */
@Component({
  selector: 'app-resource-discussion-input',
  standalone: true,
  imports: [ FormsModule ],
  templateUrl: './resource-discussion-input.component.html',
  styleUrl: './resource-discussion-input.component.scss',
})
export class ResourceDiscussionInputComponent {
  /** Current resource id for discussion creation. */
  @Input() resourceId!: string;

  /** Text being composed by the user. */
  text: string = '';

  /** Auth service for user gating. */
  private auth = inject(AuthService);
  /** Discussion API service. */
  private discussionService = inject(DiscussionService);
  /** Router used to redirect to login when needed. */
  private router = inject(Router);

  /** Restore pending discussion text after login redirects. */
  ngOnInit() {
    const action = this.auth.peekPendingAction();
    if (!action) return;

    if (action.type === 'setDiscussion') {
      this.auth.runPendingAction();
      this.text = action.payload.text;
    }
  }

  /** Submit a new thread, or redirect to login if required. */
  submit() {
    if (!this.text.trim()) return;

    if (!this.auth.requireAuth()) {
      this.auth.setPendingAction({
        type: 'setDiscussion',      // was incorrectly 'setRating'
        payload: { text: this.text }
      });

      this.router.navigate(['/login'], {
        queryParams: { returnUrl: this.router.url }  // was missing entirely
      });

      return;
    }

    this.discussionService.createThread(this.resourceId, this.text).subscribe({
      next: (res) => {
        this.text = '';
      }
    });
  }
}
