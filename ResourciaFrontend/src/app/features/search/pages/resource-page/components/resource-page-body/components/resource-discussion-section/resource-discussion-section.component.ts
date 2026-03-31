import { Component, EventEmitter, Input, OnChanges, OnInit, Output, Resource, SimpleChange, SimpleChanges } from '@angular/core';
import { ResourceDiscussionThreadComponent } from './components/resource-discussion-thread/resource-discussion-thread.component';
import { Review } from '../../../../../../../../shared/models/review';
import { DiscussionThread } from '../../../../../../../../shared/models/discussion-thread';
import { ResourceDiscussionInputComponent } from './components/resource-discussion-input/resource-discussion-input.component';
import { ReviewRequestModel } from '../../../../../../../../shared/models/review-request';
import { ResourceDetailModel } from '../../../../../../../../shared/models/resource-detail';
import { DiscussionService } from '../../../../../../../../core/services/discussion.service';

@Component({
  selector: 'app-resource-discussion-section',
  standalone: true,
  imports: [ResourceDiscussionThreadComponent, ResourceDiscussionInputComponent],
  templateUrl: './resource-discussion-section.component.html',
  styleUrl: './resource-discussion-section.component.scss',
})
export class ResourceDiscussionSectionComponent implements OnChanges {
  @Input() resource: ResourceDetailModel | null = null;
  threads: DiscussionThread[] = [];
  loading = false;
  error: string | null = null;

  constructor(private discussionService: DiscussionService) {}

  get resourceId(): string {
    return this.resource?.id ?? '';
  }

  ngOnChanges(changes: SimpleChanges) {
    if (changes['resource'] && this.resource?.id) {
      console.log('Resource arrived:', this.resource);
      this.loadThreads();
    }
  }

  loadThreads() {
    this.loading = true;
    this.discussionService.getThreads(this.resourceId).subscribe({
      next: (threads) => {
        this.threads = threads;
        this.loading = false;
        console.log('Loaded threads:', threads);
      },
      error: () => {
        this.error = 'Failed to load discussions.';
        this.loading = false;
        console.error('Error loading threads for resource', this.resourceId);
      }
    });
  }
}
