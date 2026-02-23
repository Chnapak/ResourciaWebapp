import { Component, inject, OnInit } from '@angular/core';
import { FilterKind } from '../../../../shared/models/filter-kind';
import { AdminHeaderComponent } from '../../components/admin-header/admin-header.component';
import { AdminTableColumn } from '../../models/admin-table.types';
import { AdminTableComponent } from '../../components/admin-table/admin-table.component';
import { FilterRowComponent } from './filter-row.component';
import { AdminFilter } from '../../models/admin-filter.model';
import { AdminService } from '../../../../core/services/admin.service';


@Component({
  selector: 'app-filters',
  imports: [AdminHeaderComponent, AdminTableComponent, FilterRowComponent],
  templateUrl: './filters-page.component.html',
  styleUrl: './filters-page.component.scss'
})
export class FiltersAdminPageComponent implements OnInit {
  columns: AdminTableColumn[] = [
    { key: 'filter', label: 'Filter', widthClass: 'flex-1' },
    { key: 'type', label: 'Type', widthClass: 'w-32' },
    { key: 'resources', label: 'Resources', widthClass: 'w-40' },
    { key: 'lastUpdated', label: 'Last Upadted', widthClass: 'w-28' },
    { key: 'status', label: 'Status ', widthClass: 'w-28' },
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
  schema: AdminFilter[] | null = null;
  FilterKind = FilterKind;

  protected readonly AdminService = inject(AdminService);

  ngOnInit(): void {
    this.AdminService.getFilters().subscribe((data: AdminFilter[]) => {
      console.log(data)
      this.schema = data; 
    })
  }
}
