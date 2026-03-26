import { CommonModule } from '@angular/common';
import { Component, ElementRef, forwardRef, Input, OnChanges, OnInit, SimpleChanges, ViewChild } from '@angular/core';
import { AbstractControl, ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';

@Component({
  selector: 'app-textarea',
  imports: [CommonModule],
  templateUrl: './textarea.component.html',
  styleUrl: './textarea.component.scss',
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => TextareaComponent),
      multi: true,
    },
  ],

})
export class TextareaComponent implements ControlValueAccessor, OnInit, OnChanges {
  @Input() label: string = 'Label';
  @Input() placeholder: string = '';
  @Input() background: 'gray-100' | 'white' = 'gray-100';
  @Input() disabled: boolean = false;

  @Input() control: AbstractControl | null = null;

  @Input() showCharCounter: boolean = false;
  @Input() maxLength: number | null = null;
  @Input() autoGrow: boolean = false;

  @ViewChild('textareaRef') textareaRef!: ElementRef<HTMLTextAreaElement>;
 
  value: string = '';
 
  private onChange: (value: string) => void = () => {};
  onTouched: () => void = () => {};

  ngOnInit(): void {}
 
  ngOnChanges(changes: SimpleChanges): void {
    // If autoGrow is toggled on at runtime, trigger a resize pass
    if (changes['autoGrow'] && this.autoGrow && this.textareaRef) {
      this._autoResize();
    }
  }

  writeValue(val: string): void {
    this.value = val ?? '';
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

  updateValue(event: Event): void {
    const target = event.target as HTMLTextAreaElement;
    this.value = target.value;
    this.onChange(this.value);
 
    if (this.autoGrow) {
      this._autoResize(target);
    }
  }

  get showError(): boolean {
    return !!(
      this.control &&
      this.control.invalid &&
      (this.control.dirty || this.control.touched)
    );
  }
 
  get charCount(): number {
    return this.value?.length ?? 0;
  }
 
  get isOverLimit(): boolean {
    return this.maxLength !== null && this.charCount > this.maxLength;
  }

  private _autoResize(el?: HTMLTextAreaElement): void {
    const textarea = el ?? this.textareaRef?.nativeElement;
    if (!textarea) return;
    textarea.style.height = 'auto';
    textarea.style.height = `${textarea.scrollHeight}px`;
  }
}
