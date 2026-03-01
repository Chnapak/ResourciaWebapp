import { CommonModule } from '@angular/common';
import { Component, Input, Optional, Self } from '@angular/core';
import { ControlValueAccessor, NG_VALUE_ACCESSOR, NgControl } from '@angular/forms';

@Component({
  selector: 'app-textfield',
  imports: [ CommonModule ],
  templateUrl: './textfield.component.html',
  styleUrl: './textfield.component.scss',
})
export class TextfieldComponent implements ControlValueAccessor {
  @Input() label = '';
  @Input() placeholder = '';
  @Input() type: 'text' | 'password' | 'email' = 'text';

  value = '';
  disabled = false;
  showPassword = false;

  onChange = (value: string) => {};
  onTouched = () => {};

  constructor(@Optional() @Self() public ngControl: NgControl) {
    if (this.ngControl) {
      this.ngControl.valueAccessor = this;
    }
  } 

  writeValue(value: string): void {
    this.value = value ?? '';
  }

  registerOnChange(fn: any): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: any): void {
    this.onTouched = fn;
  }

  setDisabledState(isDisabled: boolean): void {
    this.disabled = isDisabled;
  }

  updateValue(event: Event) {
    const input = event.target as HTMLInputElement;
    this.value = input.value;
    this.onChange(this.value);
  }

  togglePassword() {
    this.showPassword = !this.showPassword;
  }

  get control() {
    return this.ngControl?.control;
  }

  get showError(): boolean {
    return !!(this.control?.touched && this.control?.invalid);
  }
}
