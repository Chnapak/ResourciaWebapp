import { Component, Input, input } from '@angular/core';
import { ActiveFilterChip } from '../../../../../../../../shared/models/active-filter-chip';
import { ChipComponent } from '../../../../../../../../shared/ui/chip/chip.component';
import { Router } from '@angular/router';

@Component({
  selector: 'app-resource-description-card',
  imports: [ChipComponent],
  templateUrl: './resource-description-card.component.html',
  styleUrl: './resource-description-card.component.scss',
})
export class ResourceDescriptionCardComponent {
  @Input() description: string = '';
  @Input() chips: ActiveFilterChip[] = [
  ];

  isExpanded: boolean = false;

  constructor(private router: Router) {}

  toggleDesc(): void {
    this.isExpanded = !this.isExpanded;
  }

  transferToSearch(chip: ActiveFilterChip) {
    this.router.navigate(['/search'], {
      queryParams: {
        [chip.key]: chip.value
      }
    });
  }
}
