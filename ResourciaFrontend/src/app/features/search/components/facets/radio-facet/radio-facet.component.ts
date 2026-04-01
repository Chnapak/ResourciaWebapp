import { Component, EventEmitter, Input, Output } from '@angular/core';
import { RadioComponent } from '../../../../../shared/ui/radio/radio.component';

/**
 * Display model for a radio facet option.
 */
export interface RadioFacetOption {
  /** Raw value sent to the search query. */
  value: string;
  /** Human-readable label for the option. */
  label: string;
  /** Optional badge text (e.g., counts). */
  badge?: string;
  /** Whether the option should be disabled. */
  disabled?: boolean;
}

/**
 * Single-select facet rendered as a radio group.
 */
@Component({
  selector: 'app-radio-facet',
  imports: [ RadioComponent ],
  templateUrl: './radio-facet.component.html',
  styleUrl: './radio-facet.component.scss',
})
export class RadioFacetComponent {
  /** All options available for the facet. */
  @Input() options: RadioFacetOption[] = [];
  /** Heading label for the facet group. */
  @Input() label = '';
  /** Currently selected value (or null for none). */
  @Input() selected: string | null = null;

  /** Emits updated selection when the user picks a value. */
  @Output() selectedChange = new EventEmitter<string | null>();

  /** Update selection and notify the parent. */
  onSelect(value: string | null): void {
    this.selected = value;
    this.selectedChange.emit(value); 
  }
}
