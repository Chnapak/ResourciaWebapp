import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CheckboxComponent } from '../../../../../shared/ui/checkbox/checkbox.component';
import { FormArray, FormControl, ReactiveFormsModule } from '@angular/forms';
import { Subscription } from 'rxjs';
import { CommonModule } from '@angular/common';

/**
 * Display model for a checkbox facet option.
 */
export interface CheckboxFacetOption {
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
 * Multi-select facet rendered as a list of checkboxes.
 */
@Component({
  selector: 'app-checkbox-facet',
  imports: [ CheckboxComponent, CommonModule, ReactiveFormsModule ],
  templateUrl: './checkbox-facet.component.html',
  styleUrl: './checkbox-facet.component.scss',
})
export class CheckboxFacetComponent {
  /** All options available for the facet. */
  @Input() options: CheckboxFacetOption[] = [];
  /** Heading label for the facet group. */
  @Input() label = '';
  /** Currently selected values. */
  @Input() selected: string[] = [];

  /** Emits updated selection when the user toggles options. */
  @Output() selectedChange = new EventEmitter<string[]>();

  /** Reactive form array backing the checkbox list. */
  formArray = new FormArray<FormControl<boolean>>([]);
  /** Subscription to form value changes. */
  private sub!: Subscription;

  /** Initialize the form array and wire up selection updates. */
  ngOnInit(): void {
    this.options.forEach(opt => {
      this.formArray.push(
        new FormControl<boolean>(
          { value: this.selected.includes(opt.value), disabled: opt.disabled ?? false },
          { nonNullable: true }
        )
      );
    });

    this.sub = this.formArray.valueChanges.subscribe(values => {
      const next = this.options
        .filter((_, i) => values[i])
        .map(opt => opt.value);
      this.selectedChange.emit(next);
    });
  }

  /** Clean up the value change subscription. */
  ngOnDestroy(): void {
    this.sub.unsubscribe();
  }

  /** Get the typed form control for a checkbox option. */
  getControl(i: number): FormControl<boolean> {
    return this.formArray.at(i) as FormControl<boolean>;
  }

}
