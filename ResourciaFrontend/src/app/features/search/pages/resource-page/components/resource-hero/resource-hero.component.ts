import { Component, inject } from '@angular/core';
import { ResourceHeaderComponent } from './components/resource-header/resource-header.component';
import { ResourceTagListComponent } from './components/resource-tag-list/resource-tag-list.component';
import { ResourceRatingSummaryComponent } from './components/resource-rating-summary/resource-rating-summary.component';
import { ResourceHeroActionsComponent } from './components/resource-hero-actions/resource-hero-actions.component';
import { ToasterService } from '../../../../../../shared/toaster/toaster.service';
import { ResourcePreviewPanelComponent } from './components/resource-preview-panel/resource-preview-panel.component';

@Component({
  selector: 'app-resource-hero',
  imports: [ ResourceHeaderComponent, ResourceTagListComponent, ResourceRatingSummaryComponent, ResourceHeroActionsComponent, ResourcePreviewPanelComponent ],
  templateUrl: './resource-hero.component.html',
  styleUrl: './resource-hero.component.scss',
})
export class ResourceHeroComponent {
  
}
