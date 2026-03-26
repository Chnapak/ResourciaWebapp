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
  @Input() selected: string | null = null;

  @Output() selectedChange = new EventEmitter<string | null>();
}
