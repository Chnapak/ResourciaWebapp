import { Component, EventEmitter, Input, Output } from '@angular/core';
import { SearchableSelectComponent, SelectOption } from '../../../../../shared/ui/searchable-select/searchable-select.component';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-searchable-single-facet',
  imports: [ CommonModule, SearchableSelectComponent],
  templateUrl: './searchable-single-facet.component.html',
  styleUrl: './searchable-single-facet.component.scss',
})
export class SearchableSingleFacetComponent {
  @Input() options: SelectOption[] = [];
  @Input() placeholder = 'Search…';
  @Input() disabled = false;
<<<<<<< HEAD
  @Input() selected: string | null = null;

  @Output() selectedChange = new EventEmitter<string | null>();
=======

  @Output() selectedChange = new EventEmitter<unknown>();
>>>>>>> 9c2cef82cc7c9f538a77c944e04c4cb51252b045
}
