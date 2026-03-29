import { Component, EventEmitter, inject, input, Input, OnInit, Output } from '@angular/core';
import { DiscussionThread } from '../../../../../../../../../../shared/models/discussion-thread';
import { CommonModule, DatePipe } from '@angular/common';
import { getInitials, getUserGradient } from '../../../../../../../../../../shared/utils/user.utils';
import { FormsModule } from '@angular/forms';
import { DiscussionReply } from '../../../../../../../../../../shared/models/discussion-reply';
import { AuthService } from '../../../../../../../../../../core/auth/auth.service';
import { RouteConfigLoadEnd, Router } from '@angular/router';
import { DiscussionService } from '../../../../../../../../../../core/services/discussion.service';

@Component({
  selector: 'app-resource-discussion-thread',
  standalone: true,
  imports: [ CommonModule, DatePipe, FormsModule ],
  templateUrl: './resource-discussion-thread.component.html',
  styleUrl: './resource-discussion-thread.component.scss',
})
export class ResourceDiscussionThreadComponent implements OnInit {
  @Input() thread!: DiscussionThread;
  @Output() replySubmitted = new EventEmitter<DiscussionReply>();
  showReplyInput = false;
  replyContent = '';

  private auth = inject(AuthService);
  private router = inject(Router);
  private discussionService = inject(DiscussionService);

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

  toggleReply() {
    this.showReplyInput = !this.showReplyInput;
    if (!this.showReplyInput) {
      this.replyContent = '';
    }
  }

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

  initials(username?: string) {
    return getInitials(username ?? this.thread.username);
  }

  gradient(username?: string) {
    return getUserGradient(username ?? this.thread.username);
  }
}
