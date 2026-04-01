import { Component, EventEmitter, inject, input, Input, OnInit, Output } from '@angular/core';
import { DiscussionThread } from '../../../../../../../../../../shared/models/discussion-thread';
import { CommonModule, DatePipe } from '@angular/common';
import { getInitials, getUserGradient } from '../../../../../../../../../../shared/utils/user.utils';
import { FormsModule } from '@angular/forms';
import { DiscussionReply } from '../../../../../../../../../../shared/models/discussion-reply';
import { AuthService } from '../../../../../../../../../../core/auth/auth.service';
import { Router, RouterLink } from '@angular/router';
import { DiscussionService } from '../../../../../../../../../../core/services/discussion.service';

/**
 * Single discussion thread with replies and reply composer.
 */
@Component({
  selector: 'app-resource-discussion-thread',
  standalone: true,
  imports: [ CommonModule, DatePipe, FormsModule, RouterLink ],
  templateUrl: './resource-discussion-thread.component.html',
  styleUrl: './resource-discussion-thread.component.scss',
})
export class ResourceDiscussionThreadComponent implements OnInit {
  /** Thread data to render. */
  @Input() thread!: DiscussionThread;
  /** Emit when a reply is successfully submitted. */
  @Output() replySubmitted = new EventEmitter<DiscussionReply>();
  /** Toggle visibility of the reply input. */
  showReplyInput = false;
  /** Current reply draft. */
  replyContent = '';

  /** Auth service for gating replies. */
  private auth = inject(AuthService);
  /** Router for login redirects. */
  private router = inject(Router);
  /** Discussion API service. */
  private discussionService = inject(DiscussionService);

  /** Resume any pending reply action after login. */
  ngOnInit() {
    const action = this.auth.peekPendingAction();
    console.log('Pending action on thread init:', action);
    if (!action) return;

    switch (action.type) {
      case 'setReply':
        if (action.payload.threadId !== this.thread.id) return; // ✅ wrong thread, skip

        this.auth.runPendingAction(); // consume only when matched
        this.replyContent = action.payload.text;
        this.submitReply();
        break;
    }
  }

  /** Toggle the reply input visibility. */
  toggleReply() {
    this.showReplyInput = !this.showReplyInput;
    if (!this.showReplyInput) {
      this.replyContent = '';
    }
  }

  /** Submit the reply, or redirect to login if required. */
  submitReply() {
    if (!this.replyContent.trim()) return;

    if (!this.auth.requireAuth()) {
      this.auth.setPendingAction({
        type: 'setReply',
        payload: { text: this.replyContent, threadId: this.thread.id  }
      });

      this.router.navigate(['/login'], {
        queryParams: { returnUrl: this.router.url }  // was missing entirely
      });

      return;
    }

    this.discussionService.reply(this.thread.id, this.replyContent).subscribe({
      next: (reply) => {
        this.replySubmitted.emit(reply); // parent thread can append it immediately
        this.replyContent = '';
        this.showReplyInput = false;
      },
      error: (err) => {
        console.error('Failed to send reply:', err);
      }
    });

    this.replyContent = '';
    this.showReplyInput = false;
  }

  /** Generate initials for a username (fallback to thread owner). */
  initials(username?: string) {
    return getInitials(username ?? this.thread.username);
  }

  /** Generate avatar gradient for a username. */
  gradient(username?: string) {
    return getUserGradient(username ?? this.thread.username);
  }

  /** Build profile link for a username. */
  profileLink(username: string): string[] {
    return ['/profile', username];
  }
}
