import { Component, input, Input } from '@angular/core';
import { DiscussionThread } from '../../../../../../../../../../shared/models/discussion-thread';
import { CommonModule } from '@angular/common';
import { getInitials, getUserGradient } from '../../../../../../../../../../shared/utils/user.utils';

@Component({
  selector: 'app-resource-discussion-thread',
  imports: [ CommonModule ],
  templateUrl: './resource-discussion-thread.component.html',
  styleUrl: './resource-discussion-thread.component.scss',
})
export class ResourceDiscussionThreadComponent {
  @Input() thread!: DiscussionThread;

  initials(input: string = this.thread.username): string {
    return this.thread ? getInitials(input) : '';
  }

  gradient(input: string = this.thread.username): string {
    return this.thread ? getUserGradient(input) : '';
  }
}
