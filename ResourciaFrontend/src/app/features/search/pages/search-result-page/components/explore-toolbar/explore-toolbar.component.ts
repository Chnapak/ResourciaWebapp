import { Component, EventEmitter, Input, Output } from '@angular/core';
import { ButtonComponent } from '../../../../../../shared/ui/button/button.component';
import { FacetModel } from '../../../../../../shared/models/facet';
import { ActiveChip } from '../../../../../../shared/models/active-chip';

/**
 * Toolbar above search results showing counts, chips, and actions.
 */
@Component({
  selector: 'app-explore-toolbar',
  imports: [ButtonComponent],
  templateUrl: './explore-toolbar.component.html',
  styleUrl: './explore-toolbar.component.scss'
})
export class ExploreToolbarComponent {
  /** Total number of matching resources. */
  @Input() numberOfResources: number | undefined = 0;
  /** Whether the filter sidebar is hidden. */
  @Input() areFiltersHidden = false;
  /** Active filter chips to display. */
  @Input() chips: ActiveChip[] = [];

  /** Toggle the filters sidebar. */
  @Output() toggleFilters = new EventEmitter<void>();
  /** Clear all filters. */
  @Output() clearAll = new EventEmitter<void>();
  /** Remove a specific filter chip. */
  @Output() removeChip = new EventEmitter<ActiveChip>();

  /** Emit event to toggle filters. */
  hideFilters(): void {
    this.toggleFilters.emit();
  }

  /** Emit event to clear all filters. */
  onClearAll(): void {
    this.clearAll.emit();
  }

  /** Emit event to remove a single chip. */
  onRemoveChip(chip: FacetModel): void {
    this.removeChip.emit(chip);
  }
}
