/**
 * Admin page for viewing and moderating users.
 */
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
/**
 * Hosts the admin user table and selection logic.
 */
export class UsersAdminPageComponent implements OnInit {
  /** Column definitions for the user table. */
  columns: AdminTableColumn[] = [
    { key: 'user', label: $localize`User`, widthClass: 'flex-1' },
    { key: 'resources', label: $localize`Resources`, widthClass: 'w-32' },
    { key: 'lastActive', label: $localize`Last Active`, widthClass: 'w-40' },
    { key: 'status', label: $localize`Status`, widthClass: 'w-28' },
    { key: 'actions', label: '', widthClass: 'w-20', align: 'right' },
  ];
  /** Selected user ids for bulk actions. */
  selectedIds = new Set<string>();

  /** Current list of users. */
  users: AdminUser[] = [];
  /** Loading state for user list. */
  isLoading = false;
  /** Admin API client used to fetch users. */
  protected readonly AdminService = inject(AdminService);

  /** Loads users on component initialization. */
  ngOnInit(): void {
    this.loadUsers();
  }

  /** True when all rows are selected. */
  get allSelected(): boolean {
    return this.users.length > 0 && this.selectedIds.size === this.users.length;
  }

  /** True when some rows are selected but not all. */
  get someSelected(): boolean {
    return this.selectedIds.size > 0 && !this.allSelected;
  }

  /** Toggles selection for all rows. */
  onToggleAll(checked: boolean): void {
    if (checked) {
      this.users.forEach(user => this.selectedIds.add(user.id));
      return;
    }

    this.selectedIds.clear();
  }

  /** Toggles selection for a single user. */
  onToggleOne(userId: string, checked: boolean): void {
    if (checked) {
      this.selectedIds.add(userId);
      return;
    }

    this.selectedIds.delete(userId);
  }

  /** Loads the user list and reconciles the selection set. */
  private loadUsers(): void {
    this.isLoading = true;
    this.AdminService.getUsers().subscribe({
      next: ({ items }) => {
        this.users = items;

        const validIds = new Set(items.map(user => user.id));
        this.selectedIds = new Set([...this.selectedIds].filter(id => validIds.has(id)));
        this.isLoading = false;
      },
      error: (err) => {
        console.error('Failed to load users', err);
        this.users = [];
        this.selectedIds.clear();
        this.isLoading = false;
      }
    });
  }
}
