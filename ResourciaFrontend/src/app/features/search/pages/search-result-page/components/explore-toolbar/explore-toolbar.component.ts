import { Component, EventEmitter, Input, Output } from '@angular/core';
import { ButtonComponent } from '../../../../../../shared/ui/button/button.component';
import { FacetModel } from '../../../../../../shared/models/facet';
import { ActiveChip } from '../../../../../../shared/models/active-chip';

@Component({
  selector: 'app-explore-toolbar',
  imports: [ButtonComponent],
  templateUrl: './explore-toolbar.component.html',
  styleUrl: './explore-toolbar.component.scss'
})
export class ExploreToolbarComponent {
  @Input() numberOfResources: number | undefined = 0;
  @Input() areFiltersHidden = false;
  @Input() chips: ActiveChip[] = [];

  @Output() toggleFilters = new EventEmitter<void>();
  @Output() clearAll = new EventEmitter<void>();
  @Output() removeChip = new EventEmitter<ActiveChip>();

  hideFilters(): void {
    this.toggleFilters.emit();
  }

  onClearAll(): void {
    this.clearAll.emit();
  }

  onRemoveChip(chip: FacetModel): void {
    this.removeChip.emit(chip);
  }
}
