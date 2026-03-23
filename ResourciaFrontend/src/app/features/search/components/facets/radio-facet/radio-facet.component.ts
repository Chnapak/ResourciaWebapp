import { Component, EventEmitter, Input, Output } from '@angular/core';
import { RadioComponent } from '../../../../../shared/ui/radio/radio.component';

export interface RadioFacetOption {
  value: string;
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
  @Input() selected: string | null = null;

  @Output() selectedChange = new EventEmitter<string | null>();

  onSelect(value: string | null): void {
    this.selected = value;
    this.selectedChange.emit(value); 
  }
}
