import { Component, inject } from '@angular/core';
import { SchemaResponse, FilterKind } from '../../../../shared/models/search-schema';
import { SearchService } from '../../../../core/services/search.service';
import { AdminHeaderComponent } from '../../components/admin-header/admin-header.component';
import { AdminTableColumn } from '../../models/admin-table.types';
import { AdminTableComponent } from '../../components/admin-table/admin-table.component';


@Component({
  selector: 'app-filters',
  imports: [AdminHeaderComponent, AdminTableComponent],
  templateUrl: './filters-page.component.html',
  styleUrl: './filters-page.component.scss'
})
export class FiltersAdminPageComponent {
  columns: AdminTableColumn[] = [
    { key: 'filter', label: 'Filter', widthClass: 'flex-1' },
    { key: 'type', label: 'Type', widthClass: 'w-32' },
    { key: 'resources', label: 'Resources', widthClass: 'w-40' },
    { key: 'lastUpdated', label: 'Last Upadted', widthClass: 'w-28' },
    { key: 'status', label: 'Status ', widthClass: 'w-28' },
    { key: 'actions', label: '', widthClass: 'w-20', align: 'right' },
  ];
  filters: { id: string }[] = [];
  selectedIds = new Set<string>();

  get allSelected(): boolean {
    return this.filters.length > 0 && this.selectedIds.size === this.filters.length;
  }

  get someSelected(): boolean {
    return this.selectedIds.size > 0 && !this.allSelected;
  }

  onToggleAll(checked: boolean): void {
    if (checked) {
      // select everything currently visible
      this.filters.forEach(filter => this.selectedIds.add(filter.id));
    } else {
      // clear selection
      this.selectedIds.clear();
    }
  }

  onToggleOne(userId: string, checked: boolean): void {
    if (checked) {
      this.selectedIds.add(userId);
    } else {
      this.selectedIds.delete(userId);
    }
  }

  // TODO: Remove?
  schema: SchemaResponse | null = null;
  FilterKind = FilterKind;

  protected readonly SearchService = inject(SearchService);

  ngOnInit(): void {
    this.SearchService.schema().subscribe((data: SchemaResponse) => {
      console.log(data.filters)
      this.schema = data; 
    })
  }
}
