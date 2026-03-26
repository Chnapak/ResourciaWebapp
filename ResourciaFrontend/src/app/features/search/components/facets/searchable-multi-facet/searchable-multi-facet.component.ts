<<<<<<< HEAD
import { Component, EventEmitter, Input, Output } from '@angular/core';
import { MultiSelectOption, SearchableMultiSelectComponent } from '../../../../../shared/ui/searchable-multi-select/searchable-multi-select.component';
import { OutletContext } from '@angular/router';

@Component({
  selector: 'app-searchable-multi-facet',
  standalone: true,
  imports: [SearchableMultiSelectComponent],
=======
import { Component } from '@angular/core';

@Component({
  selector: 'app-searchable-multi-facet',
  imports: [],
>>>>>>> 9c2cef82cc7c9f538a77c944e04c4cb51252b045
  templateUrl: './searchable-multi-facet.component.html',
  styleUrl: './searchable-multi-facet.component.scss',
})
export class SearchableMultiFacetComponent {
<<<<<<< HEAD
  @Input() options: MultiSelectOption[] = [];
  @Input() placeholder = 'Search…';
  @Input() disabled = false;
  @Input() selected: string[] = [];

  @Output() selectedChange = new EventEmitter<string[]>();
=======

>>>>>>> 9c2cef82cc7c9f538a77c944e04c4cb51252b045
}
