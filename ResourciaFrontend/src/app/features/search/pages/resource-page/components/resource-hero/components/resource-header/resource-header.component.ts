import { Component, Input } from '@angular/core';
import { ResourceDetailModel } from '../../../../../../../../shared/models/resource-detail';

/**
 * Heading block for the resource detail page.
 */
@Component({
  selector: 'app-resource-header',
  standalone: true,
  imports: [],
  templateUrl: './resource-header.component.html',
  styleUrl: './resource-header.component.scss',
})
export class ResourceHeaderComponent {
  /** Resource details to display. */
  @Input() resource: ResourceDetailModel | null = null;
}
