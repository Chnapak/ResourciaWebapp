import { Component, EventEmitter, Input, Output, inject } from '@angular/core';
import { ButtonComponent } from '../../../../../../../../shared/ui/button/button.component';
import { ToasterService } from '../../../../../../../../shared/toaster/toaster.service';
import { ResourceDetailModel } from '../../../../../../../../shared/models/resource-detail';

/**
 * Action buttons for the resource hero (save/share/open).
 */
@Component({
  selector: 'app-resource-hero-actions',
  imports: [ButtonComponent],
  templateUrl: './resource-hero-actions.component.html',
  styleUrl: './resource-hero-actions.component.scss',
})
export class ResourceHeroActionsComponent {
  /** Resource details to act on. */
  @Input() resource: ResourceDetailModel | null = null;
  /** Disable favorite button while API call is pending. */
  @Input() favoritePending = false;
  /** Emit when the favorite state should be toggled. */
  @Output() favoriteToggle = new EventEmitter<void>();

  /** Toast notifications for share actions. */
  private toaster = inject(ToasterService);

  /** Build a shareable URL for the resource. */
  get shareUrl(): string | null {
    if (!this.resource?.id) {
      return null;
    }

    const relativePath = `/resource/${this.resource.id}`;
    const origin = globalThis.location?.origin;

    return origin ? `${origin}${relativePath}` : relativePath;
  }

  /** Whether the current user has saved this resource. */
  get isSaved(): boolean {
    return !!this.resource?.isSavedByCurrentUser;
  }

  /** Label for the favorite button. */
  get favoriteLabel(): string {
    return this.isSaved ? 'Saved to Favorites' : 'Add to Favorites';
  }

  /** Icon class for the favorite button. */
  get favoriteIconClass(): string {
    return this.isSaved ? 'fa-solid fa-heart' : 'fa-regular fa-heart';
  }

  /** Emit favorite toggle. */
  handleFavorite(): void {
    this.favoriteToggle.emit();
  }

  /** Copy the share URL to the clipboard. */
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

  /** Attempt clipboard copy with fallback. */
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
