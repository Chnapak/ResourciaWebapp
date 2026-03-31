import { Component, EventEmitter, Input, Output, inject } from '@angular/core';
import { ButtonComponent } from '../../../../../../../../shared/ui/button/button.component';
import { ToasterService } from '../../../../../../../../shared/toaster/toaster.service';
import { ResourceDetailModel } from '../../../../../../../../shared/models/resource-detail';

@Component({
  selector: 'app-resource-hero-actions',
  imports: [ButtonComponent],
  templateUrl: './resource-hero-actions.component.html',
  styleUrl: './resource-hero-actions.component.scss',
})
export class ResourceHeroActionsComponent {
  @Input() resource: ResourceDetailModel | null = null;
  @Input() favoritePending = false;
  @Output() favoriteToggle = new EventEmitter<void>();

  private toaster = inject(ToasterService);

  get shareUrl(): string | null {
    if (!this.resource?.id) {
      return null;
    }

    const relativePath = `/resource/${this.resource.id}`;
    const origin = globalThis.location?.origin;

    return origin ? `${origin}${relativePath}` : relativePath;
  }

  get isSaved(): boolean {
    return !!this.resource?.isSavedByCurrentUser;
  }

  get favoriteLabel(): string {
    return this.isSaved ? 'Saved to Favorites' : 'Add to Favorites';
  }

  get favoriteIconClass(): string {
    return this.isSaved ? 'fa-solid fa-heart' : 'fa-regular fa-heart';
  }

  handleFavorite(): void {
    this.favoriteToggle.emit();
  }

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
