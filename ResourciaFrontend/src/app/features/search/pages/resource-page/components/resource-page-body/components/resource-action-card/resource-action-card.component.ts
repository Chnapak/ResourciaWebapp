import { Component, EventEmitter, Input, Output, inject } from '@angular/core';
import { ResourceDetailModel } from '../../../../../../../../shared/models/resource-detail';
import { ToasterService } from '../../../../../../../../shared/toaster/toaster.service';

/**
 * Sidebar actions card (save/share/report) for a resource.
 */
@Component({
  selector: 'app-resource-action-card',
  imports: [],
  templateUrl: './resource-action-card.component.html',
  styleUrl: './resource-action-card.component.scss',
})
export class ResourceActionCardComponent {
  /** Resource details used for actions. */
  @Input() resource: ResourceDetailModel | null = null;
  /** Disable favorite actions while API is pending. */
  @Input() favoritePending = false;
  /** Emit when favorite is toggled. */
  @Output() favoriteToggle = new EventEmitter<void>();

  /** Toast notifications for action feedback. */
  private readonly toaster = inject(ToasterService);

  /** Build a shareable URL for this resource. */
  get shareUrl(): string | null {
    if (!this.resource?.id) {
      return null;
    }

    const relativePath = `/resource/${this.resource.id}`;
    const origin = globalThis.location?.origin;

    return origin ? `${origin}${relativePath}` : relativePath;
  }

  /** Whether the resource is saved by the current user. */
  get isSaved(): boolean {
    return !!this.resource?.isSavedByCurrentUser;
  }

  /** Label for the save/unsave button. */
  get favoriteLabel(): string {
    return this.isSaved ? 'Saved to Library' : 'Save to Library';
  }

  /** Emit favorite toggle to the parent. */
  handleFavorite(): void {
    this.favoriteToggle.emit();
  }

  /** Copy share link to clipboard. */
  async handleShare(): Promise<void> {
    const shareUrl = this.shareUrl;
    if (!shareUrl) {
      this.toaster.show('Resource link is not available yet.', 'error');
      return;
    }

    const copied = await this.copyToClipboard(shareUrl);
    if (copied) {
      this.toaster.show('Resource link copied to clipboard.', 'success');
      return;
    }

    this.toaster.show('Could not copy the resource link.', 'error');
  }

  /** Placeholder for future "suggest improvement" flow. */
  handleSuggestImprovement(): void {
    this.toaster.show('Feature not avaible yet', 'info');
  }

  /** Placeholder report-issue action. */
  handleReportIssue(): void {
    this.toaster.show('Report submitted. Thank you.', 'success');
  }

  /** Attempt clipboard copy with a fallback path. */
  private async copyToClipboard(value: string): Promise<boolean> {
    try {
      if (globalThis.navigator?.clipboard?.writeText) {
        await globalThis.navigator.clipboard.writeText(value);
        return true;
      }
    } catch {
      // Fall back to the manual copy path below.
    }

    if (typeof document === 'undefined') {
      return false;
    }

    const textarea = document.createElement('textarea');
    textarea.value = value;
    textarea.setAttribute('readonly', 'true');
    textarea.style.position = 'fixed';
    textarea.style.opacity = '0';
    textarea.style.pointerEvents = 'none';

    document.body.appendChild(textarea);
    textarea.focus();
    textarea.select();

    try {
      return document.execCommand('copy');
    } catch {
      return false;
    } finally {
      document.body.removeChild(textarea);
    }
  }
}
