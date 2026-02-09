import { Component } from '@angular/core';
import { AdminHeaderComponent } from '../../components/admin-header/admin-header.component';
import { AdminTableComponent } from '../../components/admin-table/admin-table.component';
import { AdminTableColumn } from '../../models/admin-table.types';
import { UserRowComponent } from './user-row.component';

@Component({
  selector: 'app-users',
  imports: [AdminHeaderComponent, AdminTableComponent, UserRowComponent],
  templateUrl: './users-page.component.html',
  styleUrl: './users-page.component.scss'
})
export class UsersAdminPageComponent {
  columns: AdminTableColumn[] = [
    { key: 'user', label: 'User', widthClass: 'flex-1' },
    { key: 'resources', label: 'Resources', widthClass: 'w-32' },
    { key: 'lastActive', label: 'Last Active', widthClass: 'w-40' },
    { key: 'status', label: 'Status', widthClass: 'w-28' },
    { key: 'test', label: 'Test', widthClass: 'w-28' },
    { key: 'actions', label: '', widthClass: 'w-20', align: 'right' },
  ];
  users: { id: string }[] = [];
  selectedIds = new Set<string>();

  get allSelected(): boolean {
    return this.users.length > 0 && this.selectedIds.size === this.users.length;
  }

  get someSelected(): boolean {
    return this.selectedIds.size > 0 && !this.allSelected;
  }

  onToggleAll(checked: boolean): void {
    if (checked) {
      // select everything currently visible
      this.users.forEach(user => this.selectedIds.add(user.id));
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

}
