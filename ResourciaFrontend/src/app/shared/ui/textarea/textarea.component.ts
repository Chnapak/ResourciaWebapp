import { Component, ElementRef, forwardRef, Input, OnInit, ViewChild } from '@angular/core';
import { AbstractControl, ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';

@Component({
  selector: 'app-textarea',
  templateUrl: './textarea.component.html',
  styleUrls: ['./textarea.component.scss'],
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => TextareaComponent),
      multi: true,
    },
  ],
})
export class TextareaComponent implements ControlValueAccessor, OnInit {
  @Input() label: string = 'Label';
  @Input() placeholder: string = '';
  @Input() background: 'gray-100' | 'white' = 'gray-100';
  @Input() disabled: boolean = false;

  @Input() control: AbstractControl | null = null;
  @Input() showCharCounter: boolean = false;
  @Input() maxLength: number | null = null;
  @Input() autoGrow: boolean = false;
  @Input() showError: boolean = false;

  @ViewChild('textareaRef', { static: true }) textareaRef!: ElementRef<HTMLTextAreaElement>;

  value: string = '';

  private onChange: (value: string) => void = () => {};
  onTouched: () => void = () => {};

  ngOnInit(): void {}

  writeValue(value: string): void {
    this.value = value ?? '';
  }

  registerOnChange(fn: (value: string) => void): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: () => void): void {
    this.onTouched = fn;
  }

  setDisabledState(isDisabled: boolean): void {
    this.disabled = isDisabled;
  }

  // This is called when user types
  onInput(event: Event) {
    const target = event.target as HTMLTextAreaElement;
    this.value = target.value;

    // Update ControlValueAccessor
    this.onChange(this.value);

    // If parent passed a FormControl, update it too
    if (this.control) {
      this.control.setValue(this.value);
      this.control.markAsDirty();
    }

    if (this.autoGrow && this.textareaRef?.nativeElement) {
      this._autoResize(this.textareaRef.nativeElement);
    }
  }

  private _autoResize(el: HTMLTextAreaElement) {
    el.style.height = 'auto';
    el.style.height = `${el.scrollHeight}px`;
  }

  get charCount(): number {
    return this.value?.length ?? 0;
  }

  get isOverLimit(): boolean {
    return this.maxLength !== null && this.charCount > this.maxLength;
  }

  get showErrorComputed(): boolean {
    return this.showError || !!(this.control && this.control.invalid && (this.control.dirty || this.control.touched));
  }
}