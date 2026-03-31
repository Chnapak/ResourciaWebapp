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
    { key: 'user', label: $localize`User`, widthClass: 'flex-1' },
    { key: 'resources', label: $localize`Resources`, widthClass: 'w-32' },
    { key: 'lastActive', label: $localize`Last Active`, widthClass: 'w-40' },
    { key: 'status', label: $localize`Status`, widthClass: 'w-28' },
    { key: 'actions', label: '', widthClass: 'w-20', align: 'right' },
  ];
  selectedIds = new Set<string>();

  users: AdminUser[] = [];
  protected readonly AdminService = inject(AdminService);

  ngOnInit(): void {
    this.loadUsers();
  }

  get allSelected(): boolean {
    return this.users.length > 0 && this.selectedIds.size === this.users.length;
  }

  get someSelected(): boolean {
    return this.selectedIds.size > 0 && !this.allSelected;
  }

  onToggleAll(checked: boolean): void {
    if (checked) {
      this.users.forEach(user => this.selectedIds.add(user.id));
      return;
    }

    this.selectedIds.clear();
  }

  onToggleOne(userId: string, checked: boolean): void {
    if (checked) {
      this.selectedIds.add(userId);
      return;
    }

    this.selectedIds.delete(userId);
  }

  private loadUsers(): void {
    this.AdminService.getUsers().subscribe({
      next: ({ items }) => {
        this.users = items;

        const validIds = new Set(items.map(user => user.id));
        this.selectedIds = new Set([...this.selectedIds].filter(id => validIds.has(id)));
      },
      error: (err) => {
        console.error('Failed to load users', err);
        this.users = [];
        this.selectedIds.clear();
      }
    });
  }
}
