import { Component, EventEmitter, Input, OnChanges, OnInit, Output, Resource, SimpleChange, SimpleChanges } from '@angular/core';
import { ResourceDiscussionThreadComponent } from './components/resource-discussion-thread/resource-discussion-thread.component';
import { Review } from '../../../../../../../../shared/models/review';
import { DiscussionThread } from '../../../../../../../../shared/models/discussion-thread';
import { ResourceDiscussionInputComponent } from './components/resource-discussion-input/resource-discussion-input.component';
import { ReviewRequestModel } from '../../../../../../../../shared/models/review-request';
import { ResourceDetailModel } from '../../../../../../../../shared/models/resource-detail';
import { DiscussionService } from '../../../../../../../../core/services/discussion.service';

/**
 * Discussion section for resource comments/threads.
 */
@Component({
  selector: 'app-resource-discussion-section',
  standalone: true,
  imports: [ResourceDiscussionThreadComponent, ResourceDiscussionInputComponent],
  templateUrl: './resource-discussion-section.component.html',
  styleUrl: './resource-discussion-section.component.scss',
})
export class ResourceDiscussionSectionComponent implements OnChanges {
  /** Resource to load discussion threads for. */
  @Input() resource: ResourceDetailModel | null = null;
  /** Thread list fetched from the backend. */
  threads: DiscussionThread[] = [];
  /** Loading state for thread fetch. */
  loading = false;
  /** Error message for failed loads. */
  error: string | null = null;

  /** Service for discussion threads. */
  constructor(private discussionService: DiscussionService) {}

  /** Current resource id (empty string if missing). */
  get resourceId(): string {
    return this.resource?.id ?? '';
  }

  /** Reload threads when the resource input changes. */
  ngOnChanges(changes: SimpleChanges) {
    if (changes['resource'] && this.resource?.id) {
      console.log('Resource arrived:', this.resource);
      this.loadThreads();
    }
  }

  /** Fetch threads for the current resource. */
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
