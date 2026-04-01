import { Component, EventEmitter, Input, Output } from '@angular/core';
import { getInitials, getUserGradient } from '../../../../../../../../../../shared/utils/user.utils';

/**
 * Inline reply input for a discussion thread.
 */
@Component({
  selector: 'app-resource-discussion-reply',
  imports: [],
  templateUrl: './resource-discussion-reply.component.html',
  styleUrl: './resource-discussion-reply.component.scss',
})
export class ResourceDiscussionReplyComponent {
  /** Name shown for avatar initials. */
  @Input() username: string = '';
  /** Emit the submitted reply text. */
  @Output() submitMessage = new EventEmitter<string>();

  /** Current reply text. */
  text: string = '';

  /** Initials derived from the username. */
  get initials(): string {
    return this.username ? getInitials(this.username) : '';
  }

  /** Gradient color derived from the username. */
  get gradient(): string {
    return this.username ? getUserGradient(this.username) : '#ccc';
  }

  /** Emit reply if text is non-empty. */
  submit() {
    if (!this.text.trim()) return;

    this.submitMessage.emit(this.text);
    this.text = '';
  }

}
