import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CheckboxComponent } from '../../../../../shared/ui/checkbox/checkbox.component';
import { FormArray, FormControl, ReactiveFormsModule } from '@angular/forms';
import { Subscription } from 'rxjs';
import { CommonModule } from '@angular/common';

export interface CheckboxFacetOption {
<<<<<<< HEAD
  value: string;
=======
  value: unknown;
>>>>>>> 9c2cef82cc7c9f538a77c944e04c4cb51252b045
  label: string;
  badge?: string;
  disabled?: boolean;
}

@Component({
  selector: 'app-checkbox-facet',
  imports: [ CheckboxComponent, CommonModule, ReactiveFormsModule ],
  templateUrl: './checkbox-facet.component.html',
  styleUrl: './checkbox-facet.component.scss',
})
export class CheckboxFacetComponent {
  @Input() options: CheckboxFacetOption[] = [];
  @Input() label = '';
<<<<<<< HEAD
  @Input() selected: string[] = [];

  @Output() selectedChange = new EventEmitter<string[]>();
=======
  @Input() selected: unknown[] = [];

  @Output() selectedChange = new EventEmitter<unknown[]>();
>>>>>>> 9c2cef82cc7c9f538a77c944e04c4cb51252b045

  formArray = new FormArray<FormControl<boolean>>([]);
  private sub!: Subscription;

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

  ngOnDestroy(): void {
    this.sub.unsubscribe();
  }

  getControl(i: number): FormControl<boolean> {
    return this.formArray.at(i) as FormControl<boolean>;
  }

}
