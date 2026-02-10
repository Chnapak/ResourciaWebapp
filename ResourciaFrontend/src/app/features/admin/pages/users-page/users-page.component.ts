import { Component, inject, OnInit } from '@angular/core';
import { AdminHeaderComponent } from '../../components/admin-header/admin-header.component';
import { AdminTableComponent } from '../../components/admin-table/admin-table.component';
import { AdminTableColumn } from '../../models/admin-table.types';
import { UserRowComponent } from './user-row.component';
import { AdminUser } from '../../models/admin-user.model';
import { AdminService } from '../../../../core/services/admin.service';

@Component({
  selector: 'app-users',
  imports: [AdminHeaderComponent, AdminTableComponent, UserRowComponent],
  templateUrl: './users-page.component.html',
  styleUrl: './users-page.component.scss'
})
export class UsersAdminPageComponent implements OnInit {
  columns: AdminTableColumn[] = [
    { key: 'user', label: 'User', widthClass: 'flex-1' },
    { key: 'resources', label: 'Resources', widthClass: 'w-32' },
    { key: 'lastActive', label: 'Last Active', widthClass: 'w-40' },
    { key: 'status', label: 'Status', widthClass: 'w-28' },
    { key: 'actions', label: '', widthClass: 'w-20', align: 'right' },
  ];
  selectedIds = new Set<string>();

  users: AdminUser[] | null = null;
  protected readonly AdminService = inject(AdminService);

  ngOnInit(): void {
    this.AdminService.getUsers().subscribe((res: any) => {
      this.users = res.items; 
      console.log(res.items)
    })
  }

  get allSelected(): boolean {
    if (this.users == null) {
      return false;
    }
    return this.users.length > 0 && this.selectedIds.size === this.users!.length;
  }

  get someSelected(): boolean {
    if (this.users == null) {
      return false;
    }
    return this.selectedIds.size > 0 && !this.allSelected;
  }

  onToggleAll(checked: boolean): void {
    if (checked) {
      // select everything currently visible
      this.users?.forEach(user => this.selectedIds.add(user.id));
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
