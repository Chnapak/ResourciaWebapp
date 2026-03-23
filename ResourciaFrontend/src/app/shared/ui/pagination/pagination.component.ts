import { NgClass } from '@angular/common';
import { Component, EventEmitter, Input, Output } from '@angular/core';

@Component({
  selector: 'app-pagination',
  standalone:true,
  imports: [NgClass],
  templateUrl: './pagination.component.html',
  styleUrl: './pagination.component.scss',
})
export class PaginationComponent {
  @Input() currentPage = 1;
  @Input() totalPages = 1;
  @Input() totalItems?: number;
  @Input() itemsPerPage = 12;

  @Output() pageChange = new EventEmitter<number>();

  get pageNumbers(): (number | string)[] {
    return this.getPageNumbers(this.currentPage, this.totalPages);
  }

  get startItem(): number | null {
    if (this.totalItems == null) return null;
    return (this.currentPage - 1) * this.itemsPerPage + 1;
  }

  get endItem(): number | null {
    if (this.totalItems == null) return null;
    return Math.min(this.currentPage * this.itemsPerPage, this.totalItems);
  }

  onPageSelect(page: number) {
    if (page < 1 || page > this.totalPages || page === this.currentPage) return;
    this.pageChange.emit(page);
  }

  private getPageNumbers(currentPage: number, totalPages: number): (number | string)[] {
    const pages: (number | string)[] = [];

    if (totalPages <= 7) {
      for (let i = 1; i <= totalPages; i++) pages.push(i);
      return pages;
    }

    pages.push(1);

    if (currentPage > 3) pages.push('...');

    const start = Math.max(2, currentPage - 1);
    const end = Math.min(totalPages - 1, currentPage + 1);

    for (let i = start; i <= end; i++) {
      pages.push(i);
    }

    if (currentPage < totalPages - 2) pages.push('...');

    pages.push(totalPages);

    return pages;
  }

  trackByValue = (index: number, value: number | string) => `${index}-${value}`;
}
