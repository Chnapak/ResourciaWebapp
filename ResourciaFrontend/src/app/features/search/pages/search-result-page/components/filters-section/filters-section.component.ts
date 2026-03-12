import { Component, EventEmitter, Input, Output } from '@angular/core';
import { FilterKind } from '../../../../../../shared/models/filter-kind';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-filters-section',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './filters-section.component.html',
  styleUrl: './filters-section.component.scss',
})
export class FiltersSectionComponent {
  @Input() filter!: any;
  @Input() collapsed = true;

  @Output() toggle = new EventEmitter<void>();
  @Output() facetChange = new EventEmitter<string>();
  @Output() rangeChange = new EventEmitter<{ type: 'min' | 'max'; value: string }>();
  @Output() booleanChange = new EventEmitter<boolean>();
  @Output() textChange = new EventEmitter<string>();

  FilterKind = FilterKind;

  getPlaceholder(label: string): string {
    return `Search ${label.toLowerCase()}...`;
  }

  onFacetSelect(event: Event): void {
    const value = (event.target as HTMLSelectElement).value;
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
}
