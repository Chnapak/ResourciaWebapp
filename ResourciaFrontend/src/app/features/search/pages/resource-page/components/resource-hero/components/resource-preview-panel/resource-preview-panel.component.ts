import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output } from '@angular/core';
import { ResourceImageModel } from '../../../../../../../../shared/models/resource-image';

/**
 * Preview panel placeholder for resource thumbnails or embeds.
 */
@Component({
  selector: 'app-resource-preview-panel',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './resource-preview-panel.component.html',
  styleUrl: './resource-preview-panel.component.scss',
})
export class ResourcePreviewPanelComponent {
  private _images: ResourceImageModel[] = [];

  /** Images to display in the preview panel. */
  @Input() set images(value: ResourceImageModel[] | null) {
    this._images = value ?? [];
    if (this.activeIndex >= this._images.length) {
      this.activeIndex = 0;
    }
  }
  get images(): ResourceImageModel[] {
    return this._images;
  }

  /** Loading state while images are fetched. */
  @Input() loading = false;
  /** Whether the user can upload images. */
  @Input() canUpload = false;
  /** Upload pending flag to disable the upload control. */
  @Input() uploadPending = false;

  /** Optional resource URL for quick access. */
  @Input() resourceUrl: string | null = null;

  /** Title used for alt text. */
  @Input() resourceTitle: string | null = null;

  /** Emit selected files for upload. */
  @Output() uploadFiles = new EventEmitter<FileList | null>();

  /** Index for the active image. */
  activeIndex = 0;

  /** Whether there are any images to show. */
  get hasImages(): boolean {
    return this.images.length > 0;
  }

  /** Currently active image. */
  get activeImage(): ResourceImageModel | null {
    return this.images[this.activeIndex] ?? null;
  }

  /** Emit when the user wants to open the lightbox. */
  @Output() openLightbox = new EventEmitter<number>();

  /** Host name extracted from the resource URL. */
  get resourceHost(): string | null {
    if (!this.resourceUrl) {
      return null;
    }

    try {
      return new URL(this.resourceUrl).hostname;
    } catch {
      return null;
    }
  }

  /** Select a specific image by index. */
  selectImage(index: number): void {
    if (index < 0 || index >= this.images.length) {
      return;
    }
    this.activeIndex = index;
  }

  /** Show previous image. */
  previousImage(): void {
    if (this.images.length <= 1) {
      return;
    }
    this.activeIndex = (this.activeIndex - 1 + this.images.length) % this.images.length;
  }

  /** Show next image. */
  nextImage(): void {
    if (this.images.length <= 1) {
      return;
    }
    this.activeIndex = (this.activeIndex + 1) % this.images.length;
  }

  /** Request lightbox display for the current image. */
  requestLightbox(): void {
    if (!this.hasImages) {
      return;
    }
    this.openLightbox.emit(this.activeIndex);
  }

  /** Handle file input change for uploads. */
  onFilesSelected(event: Event): void {
    const input = event.target as HTMLInputElement | null;
    const files = input?.files ?? null;
    this.uploadFiles.emit(files);

    if (input) {
      input.value = '';
    }
  }
}
