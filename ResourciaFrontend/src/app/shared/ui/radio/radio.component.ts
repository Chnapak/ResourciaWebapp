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
<<<<<<< HEAD
  @Input() value: string = '';

  @Output() select = new EventEmitter<string | null>();

  onSelect(): void {
    // We don't change selected state here, as the parent component should handle it. We just emit the value.
    if (!this.disabled) {
      if (this.selected) {
        this.select.emit(null);
      }
      else {
        this.select.emit(this.value);
      }
    }
=======
  @Input() value: unknown = null;

  @Output() select = new EventEmitter<unknown>();

  onSelect(): void {
    // We don't change selected state here, as the parent component should handle it. We just emit the value.
    if (!this.disabled) this.select.emit(this.value);
>>>>>>> 9c2cef82cc7c9f538a77c944e04c4cb51252b045
  }
}
