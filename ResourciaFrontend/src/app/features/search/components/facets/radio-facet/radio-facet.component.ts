import { Component, EventEmitter, Input, Output } from '@angular/core';
import { RadioComponent } from '../../../../../shared/ui/radio/radio.component';

export interface RadioFacetOption {
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
  selector: 'app-radio-facet',
  imports: [ RadioComponent ],
  templateUrl: './radio-facet.component.html',
  styleUrl: './radio-facet.component.scss',
})
export class RadioFacetComponent {
  @Input() options: RadioFacetOption[] = [];
  @Input() label = '';
<<<<<<< HEAD
  @Input() selected: string | null = null;

  @Output() selectedChange = new EventEmitter<string | null>();

  onSelect(value: string | null): void {
    this.selected = value;
    this.selectedChange.emit(value); 
=======
  @Input() selected: unknown = null;

  @Output() selectedChange = new EventEmitter<unknown>();

  onSelect(value: unknown): void {
    this.selectedChange.emit(value);  // ← still notifies parent if it wants to listen
>>>>>>> 9c2cef82cc7c9f538a77c944e04c4cb51252b045
  }
}
