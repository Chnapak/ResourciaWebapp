import { Component, EventEmitter, Input, Output } from '@angular/core';
import { ResourceHeaderComponent } from './components/resource-header/resource-header.component';
import { ResourceTagListComponent } from './components/resource-tag-list/resource-tag-list.component';
import { ResourceRatingSummaryComponent } from './components/resource-rating-summary/resource-rating-summary.component';
import { ResourceHeroActionsComponent } from './components/resource-hero-actions/resource-hero-actions.component';
import { ResourcePreviewPanelComponent } from './components/resource-preview-panel/resource-preview-panel.component';
import { ResourceDetailModel } from '../../../../../../shared/models/resource-detail';

/**
 * Hero section at the top of the resource detail page.
 */
@Component({
  selector: 'app-resource-hero',
  standalone: true,
  imports: [ ResourceHeaderComponent, ResourceTagListComponent, ResourceRatingSummaryComponent, ResourceHeroActionsComponent, ResourcePreviewPanelComponent ],
  templateUrl: './resource-hero.component.html',
  styleUrl: './resource-hero.component.scss',
})
export class ResourceHeroComponent {
  /** Resource details used in the hero content. */
  @Input() resource: ResourceDetailModel | null = null;
  /** Disable favorite action while requests are pending. */
  @Input() favoritePending = false;
  /** Emit when the favorite button is toggled. */
  @Output() favoriteToggle = new EventEmitter<void>();
}
