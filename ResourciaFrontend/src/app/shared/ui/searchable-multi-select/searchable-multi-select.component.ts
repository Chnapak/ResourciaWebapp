import { CommonModule } from '@angular/common';
import { Component, ElementRef, EventEmitter, forwardRef, HostListener, inject, Input, Output, ViewChild } from '@angular/core';
import { ControlValueAccessor, FormsModule, NG_ASYNC_VALIDATORS, NG_VALUE_ACCESSOR } from '@angular/forms';

export interface MultiSelectOption {
  value: string;
  label: string;
  badge?: string;
  disabled?: boolean;
}

@Component({
  selector: 'app-searchable-multi-select',
  imports: [ CommonModule, FormsModule],
  templateUrl: './searchable-multi-select.component.html',
  styleUrl: './searchable-multi-select.component.scss',
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => SearchableMultiSelectComponent),
      multi: true,
    },
  ],
})
export class SearchableMultiSelectComponent implements ControlValueAccessor {
  @Input() options: MultiSelectOption[] = [];
  @Input() placeholder = 'Search…';
  @Input() disabled = false;

  @Output() valueChange = new EventEmitter<string[]>();

  @ViewChild('searchInput') searchInputRef!: ElementRef<HTMLInputElement>;

  private elRef = inject(ElementRef);

  query = '';
  isOpen = false;
  highlightedIndex = 0;
  selectedValues: string[] = [];

  // CVA
  onChange: (val: string[]) => void = () => {};
  onTouched: () => void = () => {};

  writeValue(val: string[]): void {
    this.selectedValues = val ?? [];
  }

  registerOnChange(fn: (val: string[]) => void): void { this.onChange = fn; }
  registerOnTouched(fn: () => void): void { this.onTouched = fn; }
  setDisabledState(isDisabled: boolean): void { this.disabled = isDisabled; }

  // Computed 
  get filteredOptions(): MultiSelectOption[] {
    const q = this.query.toLowerCase().trim();
    return q
      ? this.options.filter(o => o.label.toLowerCase().includes(q))
      : this.options;
  }

  isSelected(opt: MultiSelectOption): boolean {
    return this.selectedValues.includes(opt.value);
  }

  isHighlighted(index: number): boolean {
    return this.highlightedIndex === index;
  }

  labelOf(value: string): string {
    return this.options.find(o => o.value === value)?.label ?? String(value);
  }

  // Interaction
  focusInput(): void {
    if (this.disabled) return;
    this.searchInputRef?.nativeElement.focus();
    this.isOpen = true;
  }

  onInputFocus(): void {
    this.isOpen = true;
  }

  onQueryChange(): void {
    this.isOpen = true;
    this.highlightedIndex = 0;
  }

  toggleOption(opt: MultiSelectOption): void {
    if (opt.disabled) return;
    const next = this.isSelected(opt)
      ? this.selectedValues.filter(v => v !== opt.value)
      : [...this.selectedValues, opt.value];
    this.selectedValues = next;
    this.query = '';
    this.emit();
    // keep focus on input for rapid multi-select
    this.searchInputRef?.nativeElement.focus();
  }

  removeValue(value: string, event: MouseEvent): void {
    event.stopPropagation();
    this.selectedValues = this.selectedValues.filter(v => v !== value);
    this.emit();
  }

  onKeydown(event: KeyboardEvent): void {
    const opts = this.filteredOptions;

    if (!this.isOpen) {
      if (event.key === 'ArrowDown') { event.preventDefault(); this.isOpen = true; }
      return;
    }

    switch (event.key) {
      case 'ArrowDown':
        event.preventDefault();
        this.highlightedIndex = Math.min(this.highlightedIndex + 1, opts.length - 1);
        break;
      case 'ArrowUp':
        event.preventDefault();
        this.highlightedIndex = Math.max(this.highlightedIndex - 1, 0);
        break;
      case 'Enter':
        event.preventDefault();
        if (opts[this.highlightedIndex]) this.toggleOption(opts[this.highlightedIndex]);
        break;
      case 'Escape':
        this.isOpen = false;
        this.query = '';
        break;
      case 'Backspace':
        if (!this.query && this.selectedValues.length) {
          this.selectedValues = this.selectedValues.slice(0, -1);
          this.emit();
        }
        break;
    }
  }

  // mousedown so it fires before the input blur closes the dropdown
  onOptionMousedown(event: MouseEvent, opt: MultiSelectOption): void {
    event.preventDefault();
    this.toggleOption(opt);
  }

  onInputBlur(): void {
    setTimeout(() => {
      if (!this.elRef.nativeElement.contains(document.activeElement)) {
        this.isOpen = false;
        this.query = '';
      }
    }, 120);
  }

  private emit(): void {
    this.onChange(this.selectedValues);
    this.onTouched();
    this.valueChange.emit(this.selectedValues);
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent): void {
    if (!this.elRef.nativeElement.contains(event.target)) {
      this.isOpen = false;
      this.query = '';
    }
  }
}
