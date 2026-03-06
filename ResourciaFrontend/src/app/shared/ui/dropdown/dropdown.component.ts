import { Component, ElementRef, HostListener, Input, ViewChild } from '@angular/core';

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
  host: { class: 'relative inline-block'},
  imports: [],
  templateUrl: './dropdown.component.html',
  styleUrl: './dropdown.component.scss'
})
export class DropdownComponent {
  @Input() items: DropdownItem[] = [];
  @ViewChild('dropdownPanel') dropdownPanel!: ElementRef<HTMLElement>;

  isOpen = false;
  isVisible = false;
  offsetLeft = '0px';

  constructor(private el: ElementRef) {}

  toggle() {
    if (!this.isOpen) {
      this.isVisible = true;
      setTimeout(() => {
        this.isOpen = true;
        this.clampToViewport();
      });
    }
    else {
      this.isOpen = false;
      setTimeout(() => {
        this.isVisible = false;
        this.offsetLeft = '0px';
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

  private clampToViewport(): void {
    const panel = this.dropdownPanel?.nativeElement;
    if (!panel) return;

    const windowWidth = document.body.getBoundingClientRect().width;
    const boxRight = panel.getBoundingClientRect().right;
    const overflow = boxRight - windowWidth;

    if (overflow > 0) {
      this.offsetLeft = `-${overflow + 16}px`;
    }
  }

  @HostListener('document:click', ['$event'])
  clickOutside(event: Event) {
    if (!this.el.nativeElement.contains(event.target)) {
      this.isOpen = false;
      setTimeout(() => {
        this.isVisible = false;
        this.offsetLeft = '0px';
      }, 200);
    }
  }
}
