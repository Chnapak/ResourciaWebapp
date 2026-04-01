import { Component, Input } from '@angular/core';
import { ChipComponent } from '../../../../../../../../shared/ui/chip/chip.component';
import { ResourceDetailModel } from '../../../../../../../../shared/models/resource-detail';
import { FacetModel } from '../../../../../../../../shared/models/facet';

/**
 * List of subject tags rendered in the resource hero.
 */
@Component({
  selector: 'app-resource-tag-list',
  standalone: true,
  imports: [ ChipComponent ],
  templateUrl: './resource-tag-list.component.html',
  styleUrl: './resource-tag-list.component.scss',
})
export class ResourceTagListComponent {
  /** Resource details to derive tags from. */
  @Input() resource: ResourceDetailModel | null = null;

  /** Subject facet chips derived from resource facets. */
  get subjectChips(): FacetModel[] {
    return this.resource?.facets?.filter(f => f.key === 'subject') ?? [];
  }
}
