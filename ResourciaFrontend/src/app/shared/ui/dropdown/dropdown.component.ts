import { Component, ElementRef, HostListener, Input } from '@angular/core';

export type DropdownItem =
  | DropdownActionItem
  | DropdownDividerItem;

export interface DropdownActionItem {
  type: 'action';
  label: string;
  link?: string;
  action?: () => void;
  danger?: boolean;
}

export interface DropdownDividerItem {
  type: 'divider';
}


@Component({
  selector: 'app-dropdown',
  imports: [],
  templateUrl: './dropdown.component.html',
  styleUrl: './dropdown.component.scss'
})
export class DropdownComponent {
  @Input() items: DropdownItem[] = [];

  isOpen = false;
  isVisible = false;

  constructor(private el: ElementRef) {}

  toggle() {
    if (!this.isOpen) {
      this.isVisible = true;
      setTimeout(() => {
        this.isOpen = true;
      });
    }
    else {
      this.isOpen = false;
      setTimeout(() => {
        this.isVisible = false;
      }, 200);
    }
  }
  onClick(item: DropdownItem) {
    if (item.type == 'action') {
      if (item.action) item.action();
      this.toggle();
    }
  }

  getItemClasses(item: DropdownItem): string {
    if (item.type == 'action') {
      return item.danger
        ? 'text-red-400 hover:bg-red-500/10'
        : 'hover:bg-gray-300 hover:text-heading text-body';
    }
    return ""
  }


  @HostListener('document:click', ['$event'])
  clickOutside(event: Event) {
    if (!this.el.nativeElement.contains(event.target)) {
      this.isOpen = false;
    }
  }
}
