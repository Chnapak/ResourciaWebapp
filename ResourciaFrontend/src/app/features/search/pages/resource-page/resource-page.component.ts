import { Component, inject } from '@angular/core';
import { ResourceHeroComponent } from './components/resource-hero/resource-hero.component';
import { ResourcePageBodyComponent } from './components/resource-page-body/resource-page-body.component';
import { AuthService } from '../../../../core/auth/auth.service';
import { ResourceDetailModel } from '../../../../shared/models/resource-detail';
import { ActivatedRoute } from '@angular/router';
import { ResourceService } from '../../../../core/services/resource.service';
import { ToasterService } from '../../../../shared/toaster/toaster.service';
import { ResourceSaveStateModel } from '../../../../shared/models/resource-save-state';

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
      },
      error: (err) => {
        console.error('Error fetching resource:', err);
        this.error = 'Failed to load resource.';
        this.loading = false;
      },
    });
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
}
