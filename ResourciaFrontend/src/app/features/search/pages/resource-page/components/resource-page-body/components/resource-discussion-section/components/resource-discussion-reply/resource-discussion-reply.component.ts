import { Component, EventEmitter, Input, Output } from '@angular/core';
import { getInitials, getUserGradient } from '../../../../../../../../../../shared/utils/user.utils';

@Component({
  selector: 'app-resource-discussion-reply',
  imports: [],
  templateUrl: './resource-discussion-reply.component.html',
  styleUrl: './resource-discussion-reply.component.scss',
})
export class ResourceDiscussionReplyComponent {
  @Input() username: string = '';
  @Output() submitMessage = new EventEmitter<string>();

  text: string = '';

  get initials(): string {
    return this.username ? getInitials(this.username) : '';
  }

  get gradient(): string {
    return this.username ? getUserGradient(this.username) : '#ccc';
  }

  submit() {
    if (!this.text.trim()) return;

    this.submitMessage.emit(this.text);
    this.text = '';
  }

}
