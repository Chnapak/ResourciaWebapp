import { Component, inject } from '@angular/core';
import { ResourceHeroComponent } from './components/resource-hero/resource-hero.component';
import { ResourcePageBodyComponent } from './components/resource-page-body/resource-page-body.component';
import { AuthService } from '../../../../core/auth/auth.service';
import { ResourceDetailModel } from '../../../../shared/models/resource-detail';
import { ActivatedRoute } from '@angular/router';
import { ResourceService } from '../../../../core/services/resource.service';
import { ToasterService } from '../../../../shared/toaster/toaster.service';
import { ResourceSaveStateModel } from '../../../../shared/models/resource-save-state';
import { ResourceImageModel } from '../../../../shared/models/resource-image';
import { forkJoin } from 'rxjs';
import { MeInfoModel } from '../../../../shared/models/me-info';

/**
 * Resource detail page that loads a single resource and its metadata.
 */
@Component({
  selector: 'app-resource-page',
  imports: [ ResourceHeroComponent, ResourcePageBodyComponent ],
  templateUrl: './resource-page.component.html',
  styleUrl: './resource-page.component.scss',
})
export class ResourcePageComponent {
  /** Route param id. */
  resourceId: string | null = null;
  /** Loaded resource model. */
  resource: ResourceDetailModel | null = null;
  /** Loading state for the page. */
  loading: boolean = true;
  /** Error message for loading failures. */
  error: string | null = null;
  /** Loaded images for the resource. */
  images: ResourceImageModel[] = [];
  /** Loading state for images. */
  imagesLoading = false;
  /** Upload in progress flag for image uploads. */
  imageUploadPending = false;
  /** Image deletion in progress (image id). */
  imageDeletePendingId: string | null = null;
  /** Lightbox open state. */
  lightboxOpen = false;
  /** Active lightbox index. */
  lightboxIndex = 0;
  /** Cached current user (decoded). */
  currentUser: MeInfoModel | null = null;
  /** Track images that failed to load. */
  brokenImageIds = new Set<string>();
  /** Guard against duplicate save/unsave requests. */
  favoritePending = false;

  constructor(
    private route: ActivatedRoute,
    private resourceService: ResourceService,
    private authService: AuthService,
    private toaster: ToasterService
  ) {}

  /** Pull the resource id from route params and load data. */
  ngOnInit() {
    this.authService.currentUser$.subscribe((user) => {
      this.currentUser = user;
    });

    this.resourceId = this.route.snapshot.paramMap.get('id');
    if (!this.resourceId) {
      this.error = 'Resource ID not found.';
      this.loading = false;
      return;
    }

    this.fetchResource(this.resourceId);
  }

  /** Load resource details by id. */
  fetchResource(id: string) {
    this.loading = true;
    this.resourceService.getResource(id).subscribe({
      next: (res) => {
        this.resource = {
          ...res,
          isSavedByCurrentUser: this.resource?.isSavedByCurrentUser ?? false,
        };
        this.loading = false;
        this.loadSaveState(id);
        this.loadImages(id);
      },
      error: (err) => {
        console.error('Error fetching resource:', err);
        this.error = 'Failed to load resource.';
        this.loading = false;
      },
    });
  }

  /** Whether current user can upload images. */
  get canUploadImages(): boolean {
    return this.authService.isLoggedIn();
  }

  /** Whether the current user is an admin. */
  get isAdmin(): boolean {
    return this.currentUser?.isAdmin ?? false;
  }

  /** Whether the current user can delete a given image. */
  canDeleteImage(image: ResourceImageModel | null): boolean {
    if (!image) {
      return false;
    }

    if (this.isAdmin) {
      return true;
    }

    if (image.uploadedById && this.currentUser?.id) {
      return image.uploadedById === this.currentUser.id;
    }

    return false;
  }

  /** Toggle save/unsave for the current user. */
  toggleFavorite(): void {
    const resourceId = this.resource?.id;
    if (!resourceId) {
      return;
    }

    if (!this.authService.requireAuth()) {
      return;
    }

    if (this.favoritePending) {
      return;
    }

    this.favoritePending = true;

    const request$ = this.resource?.isSavedByCurrentUser
      ? this.resourceService.unsaveResource(resourceId)
      : this.resourceService.saveResource(resourceId);

    request$.subscribe({
      next: (state) => {
        this.applySaveState(state);
        this.favoritePending = false;
        this.toaster.show(
          state.isSaved ? 'Added to favorites.' : 'Removed from favorites.',
          'success'
        );
      },
      error: (error) => {
        console.error('Error updating favorites:', error);
        this.favoritePending = false;
        this.toaster.show('Could not update favorites right now.', 'error');
      },
    });
  }

  /** Load save state (isSaved + count) for the logged-in user. */
  private loadSaveState(resourceId: string): void {
    if (!this.authService.isLoggedIn()) {
      this.applySaveState({ isSaved: false, savesCount: this.resource?.savesCount ?? 0 });
      return;
    }

    this.resourceService.getSaveState(resourceId).subscribe({
      next: (state) => this.applySaveState(state),
      error: (error) => {
        console.error('Error loading save state:', error);
        this.applySaveState({ isSaved: false, savesCount: this.resource?.savesCount ?? 0 });
      },
    });
  }

  /** Load resource images by id. */
  private loadImages(resourceId: string): void {
    this.imagesLoading = true;

    this.resourceService.getResourceImages(resourceId).subscribe({
      next: (images) => {
        this.images = images ?? [];
        this.imagesLoading = false;
      },
      error: (error) => {
        console.error('Error loading resource images:', error);
        this.images = [];
        this.imagesLoading = false;
      }
    });
  }

  /** Current image shown in lightbox. */
  get lightboxImage(): ResourceImageModel | null {
    return this.images[this.lightboxIndex] ?? null;
  }

  /** Whether the current lightbox image failed to load. */
  isImageBroken(image: ResourceImageModel | null): boolean {
    if (!image?.id) {
      return false;
    }
    return this.brokenImageIds.has(image.id);
  }

  /** Open the lightbox at a given index. */
  openLightbox(index: number): void {
    if (!this.images.length) {
      return;
    }
    this.lightboxIndex = Math.min(Math.max(index, 0), this.images.length - 1);
    this.lightboxOpen = true;
  }

  /** Close the lightbox. */
  closeLightbox(): void {
    this.lightboxOpen = false;
  }

  /** Go to previous image in lightbox. */
  previousLightbox(): void {
    if (this.images.length <= 1) {
      return;
    }
    this.lightboxIndex = (this.lightboxIndex - 1 + this.images.length) % this.images.length;
  }

  /** Go to next image in lightbox. */
  nextLightbox(): void {
    if (this.images.length <= 1) {
      return;
    }
    this.lightboxIndex = (this.lightboxIndex + 1) % this.images.length;
  }

  /** Mark an image as broken when the browser fails to load it. */
  markImageBroken(image: ResourceImageModel | null): void {
    if (!image?.id) {
      return;
    }

    if (!this.brokenImageIds.has(image.id)) {
      this.brokenImageIds.add(image.id);
    }
  }

  /** Apply save state to the current resource. */
  private applySaveState(state: ResourceSaveStateModel): void {
    if (!this.resource) {
      return;
    }

    this.resource = {
      ...this.resource,
      savesCount: state.savesCount,
      isSavedByCurrentUser: state.isSaved,
    };
  }

  /** Handle uploading one or more images from the preview panel. */
  uploadImages(files: FileList | null): void {
    if (!files?.length || !this.resourceId) {
      return;
    }

    if (!this.authService.requireAuth()) {
      return;
    }

    const allowedTypes = new Set(['image/png', 'image/jpeg', 'image/gif']);
    const maxSize = 5_000_000;
    const validFiles: File[] = [];

    Array.from(files).forEach((file) => {
      if (!allowedTypes.has(file.type)) {
        this.toaster.show('Only PNG, JPG, or GIF images are supported.', 'error');
        return;
      }
      if (file.size > maxSize) {
        this.toaster.show('Images must be 5MB or smaller.', 'error');
        return;
      }

      validFiles.push(file);
    });

    if (!validFiles.length) {
      return;
    }

    this.imageUploadPending = true;

    forkJoin(validFiles.map((file) => this.resourceService.uploadResourceImage(this.resourceId!, file))).subscribe({
      next: () => {
        this.imageUploadPending = false;
        this.toaster.show('Images uploaded successfully.', 'success');
        this.loadImages(this.resourceId!);
      },
      error: (error) => {
        console.error('Error uploading resource images:', error);
        this.imageUploadPending = false;
        this.toaster.show('Failed to upload images. Please try again.', 'error');
      }
    });
  }

  /** Delete a resource image (admin-only in UI). */
  deleteImage(image: ResourceImageModel | null): void {
    if (!image?.id || !this.resourceId) {
      return;
    }

    if (!this.authService.requireAuth()) {
      return;
    }

    if (!this.isAdmin) {
      this.toaster.show('Only admins can remove images.', 'error');
      return;
    }

    const confirmed = confirm('Remove this image from the resource?');
    if (!confirmed) {
      return;
    }

    this.imageDeletePendingId = image.id;

    this.resourceService.deleteResourceImage(image.id).subscribe({
      next: () => {
        this.imageDeletePendingId = null;
        this.toaster.show('Image removed.', 'success');
        if (this.lightboxOpen && this.lightboxImage?.id === image.id) {
          this.closeLightbox();
        }
        this.loadImages(this.resourceId!);
      },
      error: (error) => {
        console.error('Error deleting resource image:', error);
        this.imageDeletePendingId = null;
        this.toaster.show('Failed to remove image.', 'error');
      }
    });
  }
}
