import { Component, EventEmitter, Input, Output } from '@angular/core';
import { RadioComponent } from '../../../../../shared/ui/radio/radio.component';

export interface RadioFacetOption {
  value: unknown;
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
  @Input() selected: unknown = null;

  @Output() selectedChange = new EventEmitter<unknown>();

  onSelect(value: unknown): void {
    this.selectedChange.emit(value);  // ← still notifies parent if it wants to listen
  }
}
