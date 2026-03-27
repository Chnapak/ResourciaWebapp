import { Component, inject, Input } from '@angular/core';
import { ResourceHeaderComponent } from './components/resource-header/resource-header.component';
import { ResourceTagListComponent } from './components/resource-tag-list/resource-tag-list.component';
import { ResourceRatingSummaryComponent } from './components/resource-rating-summary/resource-rating-summary.component';
import { ResourceHeroActionsComponent } from './components/resource-hero-actions/resource-hero-actions.component';
import { ToasterService } from '../../../../../../shared/toaster/toaster.service';
import { ResourcePreviewPanelComponent } from './components/resource-preview-panel/resource-preview-panel.component';
import { ResourceDetailModel } from '../../../../../../shared/models/resource-detail';

@Component({
  selector: 'app-resource-hero',
  standalone: true,
  imports: [ ResourceHeaderComponent, ResourceTagListComponent, ResourceRatingSummaryComponent, ResourceHeroActionsComponent, ResourcePreviewPanelComponent ],
  templateUrl: './resource-hero.component.html',
  styleUrl: './resource-hero.component.scss',
})
export class ResourceHeroComponent {
  @Input() resource: ResourceDetailModel | null = null;
}
