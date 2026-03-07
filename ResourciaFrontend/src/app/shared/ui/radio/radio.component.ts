import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output } from '@angular/core';

@Component({
  selector: 'app-radio',
  imports: [ CommonModule ],
  templateUrl: './radio.component.html',
  styleUrl: './radio.component.scss',
})
export class RadioComponent {
  @Input() label = '';
  @Input() badge = '';
  @Input() selected = false;
  @Input() disabled = false;
  @Input() value: unknown = null;

  @Output() select = new EventEmitter<unknown>();

  onSelect(): void {
    // We don't change selected state here, as the parent component should handle it. We just emit the value.
    if (!this.disabled) this.select.emit(this.value);
  }
}
