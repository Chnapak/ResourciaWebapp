import { Component, EventEmitter, Output } from '@angular/core';
import { ResourceDiscussionThreadComponent } from './components/resource-discussion-thread/resource-discussion-thread.component';
import { Review } from '../../../../../../../../shared/models/review';
import { DiscussionThread } from '../../../../../../../../shared/models/discussion-thread';
import { ResourceDiscussionInputComponent } from './components/resource-discussion-input/resource-discussion-input.component';
import { ReviewRequestModel } from '../../../../../../../../shared/models/review-request';

@Component({
  selector: 'app-resource-discussion-section',
  standalone: true,
  imports: [ResourceDiscussionThreadComponent, ResourceDiscussionInputComponent],
  templateUrl: './resource-discussion-section.component.html',
  styleUrl: './resource-discussion-section.component.scss',
})
export class ResourceDiscussionSectionComponent {
  threads: DiscussionThread[] = [];
}
