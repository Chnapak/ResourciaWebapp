import { CommonModule } from '@angular/common';
import { Component, EventEmitter, forwardRef, HostListener, Input, Output, ElementRef, inject } from '@angular/core';
import { ControlValueAccessor, FormsModule, NG_VALUE_ACCESSOR } from '@angular/forms';

export interface SelectOption {
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
  selector: 'app-searchable-select',
  imports: [ CommonModule, FormsModule],
  templateUrl: './searchable-select.component.html',
  styleUrl: './searchable-select.component.scss',
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => SearchableSelectComponent),
      multi: true,
    },
  ],
})
export class SearchableSelectComponent implements ControlValueAccessor {
  @Input() options: SelectOption[] = [];
  @Input() placeholder = 'Search...';
  @Input() disabled = false;

<<<<<<< HEAD
  @Output() valueChange = new EventEmitter<string | null>();
=======
  @Output() valueChange = new EventEmitter<unknown>();
>>>>>>> 9c2cef82cc7c9f538a77c944e04c4cb51252b045

  // States
  query = '';
  isOpen = false;
  highlightedIndex = 0;
  selectedOption: SelectOption | null = null;

  private elRef = inject(ElementRef);

  // ControlValueAccessor methods
<<<<<<< HEAD
  private onChange: (value: string | null) => void = () => {}
  private onTouched: () => void = () => {};

  writeValue(val: string): void {
    this.selectedOption = this.options.find(o => o.value === val) ?? null;
  }

  registerOnChange(fn: (val: string | null) => void): void {
=======
  private onChange: (value: unknown) => void = () => {}
  private onTouched: () => void = () => {};

  writeValue(val: any): void {
    this.selectedOption = this.options.find(o => o.value === val) ?? null;
  }

  registerOnChange(fn: (val: unknown) => void): void {
>>>>>>> 9c2cef82cc7c9f538a77c944e04c4cb51252b045
    this.onChange = fn;
  }

  registerOnTouched(fn: () => void): void {
    this.onTouched = fn;
  }

  setDisabledState(isDisabled: boolean): void { 
    this.disabled = isDisabled; 
  }

  // Computed
  get filteredOptions(): SelectOption[] {
    const q = this.query.toLowerCase().trim();
    return q ? this.options.filter(o => o.label.toLowerCase().includes(q)) : this.options;
  }

  // Iteration
  openDropdown(): void {
     if (this.disabled) return;
    this.isOpen = true;
    this.highlightedIndex = 0;
  }

  toggleDropdown(): void {
    if (this.disabled) return;
    this.isOpen = !this.isOpen;
    if (this.isOpen) this.highlightedIndex = 0;
  }

  selectOption(option: SelectOption): void {
    if (option.disabled) return;
    this.selectedOption = option;
    this.query = '';
    this.onChange(option.value);
    this.onTouched()
    this.valueChange.emit(option.value);
    this.isOpen = false;
  }

  clearSelection(event: MouseEvent): void {
    event.stopPropagation();
    this.selectedOption = null;
    this.query = '';
    this.onChange(null);
    this.onTouched();
    this.valueChange.emit(null);
  }

  onQueryChange(): void {
    this.isOpen = true;
    this.highlightedIndex = 0;
  }

  onKeydown(event: KeyboardEvent): void {
    const opts = this.filteredOptions;
    if (!this.isOpen) {
      if (event.key === 'ArrowDown' || event.key === 'Enter') {
        event.preventDefault();
        this.openDropdown();
      }
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
        if (opts[this.highlightedIndex]) this.selectOption(opts[this.highlightedIndex]);
        break;
      case 'Escape':
        this.isOpen = false;
        this.query = '';
        break;
      case 'Tab':
        this.isOpen = false;
        break;
    }
  }

  isHighlighted(index: number): boolean {
    return this.highlightedIndex === index;
  }

  isSelected(opt: SelectOption): boolean {
    return this.selectedOption?.value === opt.value;
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent): void {
    if (!this.elRef.nativeElement.contains(event.target)) {
      this.isOpen = false;
      this.query = '';
    }
  }
}
