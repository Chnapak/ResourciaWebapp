import { Component, EventEmitter, Input, Output } from '@angular/core';
import { MultiSelectOption, SearchableMultiSelectComponent } from '../../../../../shared/ui/searchable-multi-select/searchable-multi-select.component';
import { OutletContext } from '@angular/router';

@Component({
  selector: 'app-searchable-multi-facet',
  standalone: true,
  imports: [SearchableMultiSelectComponent],
  templateUrl: './searchable-multi-facet.component.html',
  styleUrl: './searchable-multi-facet.component.scss',
})
export class SearchableMultiFacetComponent {
  @Input() options: MultiSelectOption[] = [];
  @Input() placeholder = 'Search…';
  @Input() disabled = false;
  @Input() selected: string[] = [];

  @Output() selectedChange = new EventEmitter<string[]>();
}
