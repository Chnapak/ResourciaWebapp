import { Component, EventEmitter, Input, Output } from '@angular/core';
import { FilterKind } from '../../../../../../shared/models/filter-kind';
import { CommonModule } from '@angular/common';
import { CheckboxFacetComponent } from '../../../../components/facets/checkbox-facet/checkbox-facet.component';
import { RadioFacetComponent } from '../../../../components/facets/radio-facet/radio-facet.component';
import { SearchableSingleFacetComponent } from '../../../../components/facets/searchable-single-facet/searchable-single-facet.component';
import { SearchableMultiFacetComponent } from '../../../../components/facets/searchable-multi-facet/searchable-multi-facet.component';

@Component({
  selector: 'app-filters-section',
  standalone: true,
  imports: [CommonModule, CheckboxFacetComponent, RadioFacetComponent, SearchableSingleFacetComponent, SearchableMultiFacetComponent],
  templateUrl: './filters-section.component.html',
  styleUrl: './filters-section.component.scss',
})
export class FiltersSectionComponent {
  @Input() filter!: any;
  @Input() collapsed = true;
  @Input() facetState: string | string[] | null = null;
  @Input() rangeState: { min?: string; max?: string } = {};
  @Input() booleanState = false;
  @Input() textState = '';

  @Output() toggle = new EventEmitter<void>();
  @Output() facetChange = new EventEmitter<string | string[] | null>();
  @Output() rangeChange = new EventEmitter<{ type: 'min' | 'max'; value: string }>();
  @Output() booleanChange = new EventEmitter<boolean>();
  @Output() textChange = new EventEmitter<string>();

  FilterKind = FilterKind;

  getPlaceholder(label: string): string {
    return `Search ${label.toLowerCase()}...`;
  }

  onFacetSelect(value: string | string[] | null): void {
    this.facetChange.emit(value);
  }

  onRangeChange(type: 'min' | 'max', event: Event): void {
    const value = (event.target as HTMLInputElement).value;
    this.rangeChange.emit({ type, value });
  }

  onBooleanChange(event: Event): void {
    const value = (event.target as HTMLInputElement).checked;
    this.booleanChange.emit(value);
  }

  onTextChange(event: Event): void {
    const value = (event.target as HTMLInputElement).value;
    this.textChange.emit(value);
  }

  facetStateAsMulti(value: string | string[] | null): string[] {
    return Array.isArray(value) ? value : [];
  }

  facetStateAsSingle(value: string | string[] | null): string | null {
    return typeof value === 'string' ? value : null;
  }
}
