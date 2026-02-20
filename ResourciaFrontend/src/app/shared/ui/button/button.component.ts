import { NgClass, NgTemplateOutlet } from '@angular/common';
import { Component, Input } from '@angular/core';
import { RouterLink } from '@angular/router';

type ButtonVariant = 'primary' | 'outline' | 'ghost' | 'danger';
type ButtonSize = 'sm' | 'md' | 'lg';

@Component({
  selector: 'ui-button',
  standalone: true,
  imports: [RouterLink, NgTemplateOutlet],
  templateUrl: './button.component.html',
  styleUrl: './button.component.scss'
})
export class ButtonComponent {
  @Input() variant: ButtonVariant = 'primary';
  @Input() size: ButtonSize = 'lg';

  /** For navigation buttons */
  @Input() routerLink: string | any[] | null = null;
  @Input() queryParams: Record<string, any> | null = null;

  /** For action buttons */
  @Input() type: 'button' | 'submit' = 'button';
  @Input() disabled = false;

  /** Shared */
  @Input() loading = false;
  @Input() fullWidth = false;

  get classes(): string {
    const base =
      'inline-flex items-center justify-center gap-[6px] whitespace-nowrap rounded-[8px] ' +
      'text-[14px] transition-colors select-none cursor-pointer ' +
      'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2';

    const size =
      this.size === 'sm'
        ? 'px-[12px] py-[6px] font-[600]'
        : this.size === 'lg'
          ? 'px-[18px] py-[10px] font-[500]'
          : 'px-[16px] py-[8px] font-[600]';

    const variant =
      this.variant === 'primary'
        ? 'bg-blue-500 text-white hover:bg-blue-600'
        : this.variant === 'outline'
          ? 'bg-white text-black border border-gray-400 hover:border-blue-500 hover:text-blue-500'
          : this.variant === 'ghost'
            ? 'bg-transparent text-black hover:bg-gray-100'
            : 'bg-red-500 text-white hover:bg-red-600';

    const width = this.fullWidth ? 'w-full' : '';

    // disable pointer events while loading, and dim disabled buttons
    const state =
      this.loading ? 'pointer-events-none opacity-80' : (this.disabled ? 'opacity-50 cursor-not-allowed' : '');

    return [base, size, variant, width, state].filter(Boolean).join(' ');
  }
}
