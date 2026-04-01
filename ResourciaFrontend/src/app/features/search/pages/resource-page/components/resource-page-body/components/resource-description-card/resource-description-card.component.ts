import { Component, Input, input } from '@angular/core';
import { ChipComponent } from '../../../../../../../../shared/ui/chip/chip.component';
import { Router } from '@angular/router';
import { ResourceDetailModel } from '../../../../../../../../shared/models/resource-detail';
import { FacetModel } from '../../../../../../../../shared/models/facet';

/**
 * Description card with expandable text and facet chips.
 */
@Component({
  selector: 'app-resource-description-card',
  imports: [ChipComponent],
  templateUrl: './resource-description-card.component.html',
  styleUrl: './resource-description-card.component.scss',
})
export class ResourceDescriptionCardComponent {
  /** Resource details shown in the card. */
  @Input() resource: ResourceDetailModel | null = null;

  /** Toggle state for expanding long descriptions. */
  isExpanded: boolean = false;

  /** Router used to jump to search filtered by chips. */
  constructor(private router: Router) {}

  /** Toggle expanded/collapsed description. */
  toggleDesc(): void {
    this.isExpanded = !this.isExpanded;
  }

  /** Navigate to search results filtered by a clicked chip. */
  transferToSearch(chip: FacetModel) {
    this.router.navigate(['/search'], {
      queryParams: {
        [chip.key]: chip.value
      }
    });
  }
}
