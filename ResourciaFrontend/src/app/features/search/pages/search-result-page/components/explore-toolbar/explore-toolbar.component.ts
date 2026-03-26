import { Component, EventEmitter, Input, Output } from '@angular/core';
import { ButtonComponent } from '../../../../../../shared/ui/button/button.component';
import { ActiveFilterChip } from '../../../../../../shared/models/active-filter-chip';

@Component({
  selector: 'app-explore-toolbar',
  imports: [ButtonComponent],
  templateUrl: './explore-toolbar.component.html',
  styleUrl: './explore-toolbar.component.scss'
})
export class ExploreToolbarComponent {
  @Input() numberOfResources: number | undefined = 0;
  @Input() areFiltersHidden = false;
  @Input() chips: ActiveFilterChip[] = [];

  @Output() toggleFilters = new EventEmitter<void>();
  @Output() clearAll = new EventEmitter<void>();
  @Output() removeChip = new EventEmitter<ActiveFilterChip>();

  hideFilters(): void {
    this.toggleFilters.emit();
  }

  onClearAll(): void {
    this.clearAll.emit();
  }

  onRemoveChip(chip: ActiveFilterChip): void {
    this.removeChip.emit(chip);
  }
}
