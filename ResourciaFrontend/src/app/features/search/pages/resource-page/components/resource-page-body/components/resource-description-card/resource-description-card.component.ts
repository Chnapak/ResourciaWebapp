import { Component, Input, input } from '@angular/core';
import { ChipComponent } from '../../../../../../../../shared/ui/chip/chip.component';
import { Router } from '@angular/router';
import { ResourceDetailModel } from '../../../../../../../../shared/models/resource-detail';
import { FacetModel } from '../../../../../../../../shared/models/facet';

@Component({
  selector: 'app-resource-description-card',
  imports: [ChipComponent],
  templateUrl: './resource-description-card.component.html',
  styleUrl: './resource-description-card.component.scss',
})
export class ResourceDescriptionCardComponent {
  @Input() resource: ResourceDetailModel | null = null;

  isExpanded: boolean = false;

  constructor(private router: Router) {}

  toggleDesc(): void {
    this.isExpanded = !this.isExpanded;
  }

  transferToSearch(chip: FacetModel) {
    this.router.navigate(['/search'], {
      queryParams: {
        [chip.key]: chip.value
      }
    });
  }
}
