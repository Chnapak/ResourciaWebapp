import { Component, EventEmitter, Input, Output } from '@angular/core';
import { SearchableSelectComponent, SelectOption } from '../../../../../shared/ui/searchable-select/searchable-select.component';
import { CommonModule } from '@angular/common';

/**
 * Search facet that allows selecting a single option with search.
 */
@Component({
  selector: 'app-searchable-single-facet',
  imports: [ CommonModule, SearchableSelectComponent],
  templateUrl: './searchable-single-facet.component.html',
  styleUrl: './searchable-single-facet.component.scss',
})
export class SearchableSingleFacetComponent {
  /** Options rendered in the searchable dropdown. */
  @Input() options: SelectOption[] = [];
  /** Placeholder text shown in the search input. */
  @Input() placeholder = 'Search…';
  /** Whether the control is disabled. */
  @Input() disabled = false;
  /** Currently selected value (or null for none). */
  @Input() selected: string | null = null;

  /** Emits updated selections. */
  @Output() selectedChange = new EventEmitter<string | null>();
}
