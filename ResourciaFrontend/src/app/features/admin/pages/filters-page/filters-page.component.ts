import { Component, inject, OnInit } from '@angular/core';
import { FilterKind } from '../../../../shared/models/filter-kind';
import { AdminHeaderComponent } from '../../components/admin-header/admin-header.component';
import { AdminTableColumn } from '../../models/admin-table.types';
import { AdminTableComponent } from '../../components/admin-table/admin-table.component';
import { FilterRowComponent } from './filter-row.component';
import { AdminFilter } from '../../models/admin-filter.model';
import { AdminService } from '../../../../core/services/admin.service';
import { CdkDragDrop, DragDropModule, moveItemInArray } from '@angular/cdk/drag-drop';
import { AdminFilterReorderModel } from '../../models/admin-filter-reorder.model';


@Component({
  selector: 'app-filters',
  imports: [AdminHeaderComponent, AdminTableComponent, FilterRowComponent, DragDropModule ],
  templateUrl: './filters-page.component.html',
  styleUrl: './filters-page.component.scss'
})
export class FiltersAdminPageComponent implements OnInit {
  columns: AdminTableColumn[] = [
    { key: 'filter', label: $localize`Filter`, widthClass: 'flex-1' },
    { key: 'type', label: $localize`Type`, widthClass: 'w-32' },
    { key: 'resources', label: $localize`Resources`, widthClass: 'w-40' },
    { key: 'lastUpdated', label: $localize`Last Updated`, widthClass: 'w-28' },
    { key: 'status', label: $localize`Status`, widthClass: 'w-28' },
    { key: 'actions', label: '', widthClass: 'w-20', align: 'right' },
  ];
  filters: { id: string }[] = [];
  selectedKeys = new Set<string>();

  get allSelected(): boolean {
    return this.filters.length > 0 && this.selectedKeys.size === this.filters.length;
  }

  get someSelected(): boolean {
    return this.selectedKeys.size > 0 && !this.allSelected;
  }

  onToggleAll(checked: boolean): void {
    if (checked) {
      // select everything currently visible
      this.filters.forEach(filter => this.selectedKeys.add(filter.id));
    } else {
      // clear selection
      this.selectedKeys.clear();
    }
  }

  onToggleOne(userId: string, checked: boolean): void {
    if (checked) {
      this.selectedKeys.add(userId);
    } else {
      this.selectedKeys.delete(userId);
    }
  }

  // TODO: Remove?
  schema: AdminFilter[] = [];
  FilterKind = FilterKind;

  protected readonly AdminService = inject(AdminService);

  ngOnInit(): void {
    this.AdminService.getFilters().subscribe((data: AdminFilter[]) => {
      console.log(data)
      this.schema = data; 
    })
  }

  drop(event: CdkDragDrop<any[]>) {
    if (!this.schema) return;
    if (event.previousIndex === event.currentIndex) return;

    const fromIndex = event.previousIndex;
    const toIndex = event.currentIndex;

    // this is the item being moved (from the original array before move)
    const moved = this.schema[fromIndex];

    // update UI order
    moveItemInArray(this.schema, fromIndex, toIndex);

    const above = toIndex > 0 ? this.schema[toIndex - 1] : null;
    const below = toIndex < this.schema.length - 1 ? this.schema[toIndex + 1] : null;

    const payload: AdminFilterReorderModel = {
      movedId: moved.id,
      aboveId: above?.id ?? null,
      belowId: below?.id ?? null,
    }

    console.log('Reorder payload', payload);

    this.AdminService.reorderFilters(payload).subscribe();
  }
}