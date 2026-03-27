import { Component, Input } from '@angular/core';
import { ResourceDetailModel } from '../../../../../../../../shared/models/resource-detail';

@Component({
  selector: 'app-resource-header',
  standalone: true,
  imports: [],
  templateUrl: './resource-header.component.html',
  styleUrl: './resource-header.component.scss',
})
export class ResourceHeaderComponent {
  @Input() resource: ResourceDetailModel | null = null;
}
