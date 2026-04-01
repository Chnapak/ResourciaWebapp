import { Component, EventEmitter, Input, Output } from '@angular/core';
import { FilterKind } from '../../../../../../shared/models/filter-kind';
import { CommonModule } from '@angular/common';
import { CheckboxFacetComponent } from '../../../../components/facets/checkbox-facet/checkbox-facet.component';
import { RadioFacetComponent } from '../../../../components/facets/radio-facet/radio-facet.component';
import { SearchableSingleFacetComponent } from '../../../../components/facets/searchable-single-facet/searchable-single-facet.component';
import { SearchableMultiFacetComponent } from '../../../../components/facets/searchable-multi-facet/searchable-multi-facet.component';

/**
 * Single filter section with toggle + input controls.
 */
@Component({
  selector: 'app-filters-section',
  standalone: true,
  imports: [CommonModule, CheckboxFacetComponent, RadioFacetComponent, SearchableSingleFacetComponent, SearchableMultiFacetComponent],
  templateUrl: './filters-section.component.html',
  styleUrl: './filters-section.component.scss',
})
export class FiltersSectionComponent {
  /** Filter schema definition. */
  @Input() filter!: any;
  /** Collapsed state for the section. */
  @Input() collapsed = true;
  /** Current facet state for this filter. */
  @Input() facetState: string | string[] | null = null;
  /** Current numeric range state. */
  @Input() rangeState: { min?: string; max?: string } = {};
  /** Current boolean state. */
  @Input() booleanState = false;
  /** Current text state. */
  @Input() textState = '';

  /** Emit toggle events for collapsing. */
  @Output() toggle = new EventEmitter<void>();
  /** Emit updated facet values. */
  @Output() facetChange = new EventEmitter<string | string[] | null>();
  /** Emit updated range values. */
  @Output() rangeChange = new EventEmitter<{ type: 'min' | 'max'; value: string }>();
  /** Emit updated boolean values. */
  @Output() booleanChange = new EventEmitter<boolean>();
  /** Emit updated text values. */
  @Output() textChange = new EventEmitter<string>();

  /** Expose enum to template. */
  FilterKind = FilterKind;

  /** Build placeholder text for a text filter. */
  getPlaceholder(label: string): string {
    return `Search ${label.toLowerCase()}...`;
  }

  /** Emit selection for facet controls. */
  onFacetSelect(value: string | string[] | null): void {
    this.facetChange.emit(value);
  }

  /** Emit changes for range inputs. */
  onRangeChange(type: 'min' | 'max', event: Event): void {
    const value = (event.target as HTMLInputElement).value;
    this.rangeChange.emit({ type, value });
  }

  /** Emit changes for boolean inputs. */
  onBooleanChange(event: Event): void {
    const value = (event.target as HTMLInputElement).checked;
    this.booleanChange.emit(value);
  }

  /** Emit changes for text inputs. */
  onTextChange(event: Event): void {
    const value = (event.target as HTMLInputElement).value;
    this.textChange.emit(value);
  }

  /** Ensure a multi-select value is always an array. */
  facetStateAsMulti(value: string | string[] | null): string[] {
    return Array.isArray(value) ? value : [];
  }

  /** Ensure a single-select value is always a string or null. */
  facetStateAsSingle(value: string | string[] | null): string | null {
    return typeof value === 'string' ? value : null;
  }
}
