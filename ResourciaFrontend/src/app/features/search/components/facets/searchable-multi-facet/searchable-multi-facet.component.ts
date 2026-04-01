import { Component, EventEmitter, Input, Output } from '@angular/core';
import { MultiSelectOption, SearchableMultiSelectComponent } from '../../../../../shared/ui/searchable-multi-select/searchable-multi-select.component';
import { OutletContext } from '@angular/router';

/**
 * Search facet that allows selecting multiple options with search.
 */
@Component({
  selector: 'app-searchable-multi-facet',
  standalone: true,
  imports: [SearchableMultiSelectComponent],
  templateUrl: './searchable-multi-facet.component.html',
  styleUrl: './searchable-multi-facet.component.scss',
})
export class SearchableMultiFacetComponent {
  /** Options rendered in the multi-select list. */
  @Input() options: MultiSelectOption[] = [];
  /** Placeholder text shown in the search input. */
  @Input() placeholder = 'Search…';
  /** Whether the entire control is disabled. */
  @Input() disabled = false;
  /** Currently selected values. */
  @Input() selected: string[] = [];

  /** Emits updated selections. */
  @Output() selectedChange = new EventEmitter<string[]>();
}
