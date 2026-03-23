import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, EventEmitter, Input, Output } from '@angular/core';

export type ChipIntent =
  | 'neutral'
  | 'brand'
  | 'info'
  | 'success'
  | 'warning'
  | 'danger';

export type ChipSize = 'sm' | 'md';

const INTENT_DEFAULT: Record<ChipIntent, string> = {
  neutral: 'bg-gray-50 border-gray-300 text-gray-500',
  brand:   'bg-blue-50 border-blue-300 text-blue-700',
  info:    'bg-sky-50 border-sky-300 text-sky-700',
  success: 'bg-emerald-50 border-emerald-300 text-emerald-700',
  warning: 'bg-amber-50 border-amber-300 text-amber-700',
  danger:  'bg-rose-50 border-rose-300 text-rose-700',
};

const INTENT_SELECTED: Record<ChipIntent, string> = {
  neutral: 'bg-gray-700 border-gray-700 text-white',
  brand:   'bg-blue-600 border-blue-600 text-white',
  info:    'bg-sky-500 border-sky-500 text-white',
  success: 'bg-emerald-600 border-emerald-600 text-white',
  warning: 'bg-amber-500 border-amber-500 text-white',
  danger:  'bg-rose-600 border-rose-600 text-white',
};

const INTENT_HOVER: Record<ChipIntent, string> = {
  neutral: 'hover:bg-gray-100 hover:border-gray-300',
  brand:   'hover:bg-blue-100 hover:border-blue-300',
  info:    'hover:bg-sky-100 hover:border-sky-300',
  success: 'hover:bg-emerald-100 hover:border-emerald-300',
  warning: 'hover:bg-amber-100 hover:border-amber-300',
  danger:  'hover:bg-rose-100 hover:border-rose-300',
};

@Component({
  selector: 'app-chip',
  standalone: true,
  imports: [ CommonModule ],
  templateUrl: './chip.component.html',
  styleUrl: './chip.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ChipComponent {
  @Input() intent: ChipIntent = 'neutral';
  @Input() size: ChipSize = 'md';
  @Input() selected = false;
  @Input() disabled = false;
  @Input() removable = false;
  @Input() icon: string | null = null;
  @Input() clickable = false;

  @Output() chipClick = new EventEmitter<void>();
  @Output() remove = new EventEmitter<void>();

  get classes(): string {
    const base = [
      'inline-flex items-center border rounded-full font-medium transition-all duration-100 select-none w-fit whitespace-nowrap',
      this.size === 'sm' ? 'px-2.5 py-0.5 text-[11px] gap-1' : 'px-3 py-1 text-[12.5px] gap-1.5',
      this.selected ? INTENT_SELECTED[this.intent] : INTENT_DEFAULT[this.intent],
      this.clickable && !this.disabled ? `cursor-pointer active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-1 ${INTENT_HOVER[this.intent]}` : '',
      this.disabled ? 'opacity-40 pointer-events-none' : '',
    ];
    return base.filter(Boolean).join(' ');
  }

  get removeButtonClasses(): string {
    return [
      'inline-flex items-center justify-content-center rounded-full border-none bg-transparent p-0 cursor-pointer transition-opacity duration-100 opacity-50 hover:opacity-100',
      this.size === 'sm' ? 'w-3 h-3' : 'w-3.5 h-3.5',
    ].join(' ');
  }

  get iconClasses(): string {
    return this.size === 'sm' ? 'w-3 h-3 flex-shrink-0' : 'w-3.5 h-3.5 flex-shrink-0';
  }

  isSvgIcon(s: string): boolean {
    return s.trim().startsWith('<');
  }

  onClick(): void {
    if (!this.disabled && this.clickable) this.chipClick.emit();
  }

  onRemove(e: MouseEvent): void {
    e.stopPropagation();
    if (!this.disabled) this.remove.emit();
  }

  onKeydown(e: KeyboardEvent): void {
    if ((e.key === 'Enter' || e.key === ' ') && this.clickable) {
      e.preventDefault();
      this.onClick();
    }
  }
}
