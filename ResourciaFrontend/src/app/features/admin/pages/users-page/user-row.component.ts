import { Component, EventEmitter, Input, Output } from '@angular/core';
import { TableRowBase } from '../../components/table-row-base';
import { AdminUser } from '../../models/admin-user.model';
import { Router, RouterLink } from '@angular/router';
import { DropdownComponent, DropdownItem } from '../../../../shared/ui/dropdown/dropdown.component';
import { ReasonModalComponent } from '../../components/reason-modal/reason-modal.component';
import { AdminService } from '../../../../core/services/admin.service';
import { CheckboxComponent } from '../../../../shared/ui/checkbox/checkbox.component';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-user-row',
  imports: [RouterLink, DropdownComponent, CheckboxComponent, ReasonModalComponent, FormsModule],
  standalone: true,
  templateUrl: './user-row.component.html',
  styleUrl: './user-row.component.scss'
})
export class UserRowComponent extends TableRowBase {
  @Input({ required: true }) user!: AdminUser;
  @Input() selected = false;

  @Output() toggle = new EventEmitter<{ id: string; checked: boolean }>();

  modal: { type: 'suspend' | 'ban'; user: AdminUser } | null = null;

  constructor(private router: Router, private adminService: AdminService) {
    super();
  }

  get userMenuItems(): DropdownItem[] {
    const items: DropdownItem[] = [
      {
        type: 'action',
        label: $localize`View Profile`,
        action: () => this.viewUser()
      },
      {
        type: 'divider'
      },
    ];

    if (this.user.status === 'active') {
      items.push(
        {
          type: 'action',
          label: $localize`Suspend`,
          action: () => this.suspendUser(),
          danger: true
        },
        {
          type: 'action',
          label: $localize`Ban`,
          action: () => this.banUser(),
          danger: true
        },
      );
    } else if (this.user.status === 'suspended') {
      items.push(
        {
          type: 'action',
          label: $localize`Unsuspend`,
          action: () => this.unsuspendUser(),
          danger: true
        },
        {
          type: 'action',
          label: $localize`Ban`,
          action: () => this.banUser(),
          danger: true
        },
      );
    } else {
      items.push(
        {
          type: 'action',
          label: $localize`Unban`,
          action: () => this.unbanUser(),
          danger: true
        },
      );
    }

    return items;
  }

  viewUser(): void {
    const url = this.router.serializeUrl(
      this.router.createUrlTree(['/profile', this.profileIdentifier])
    );
    window.open(url, '_blank');
  }

  suspendUser(): void {
    this.openModal('suspend', this.user);
  }

  unsuspendUser(): void {
    this.adminService.unsuspendUser(this.user.id).subscribe(() => {
      this.user.status = 'active';
    });
  }

  banUser(): void {
    this.openModal('ban', this.user);
  }

  unbanUser(): void {
    this.adminService.unbanUser(this.user.id).subscribe(() => {
      this.user.status = 'active';
    });
  }

  openModal(type: 'suspend' | 'ban', user: AdminUser): void {
    this.modal = { type, user };
  }

  handleConfirm(data: { reason: string; durationDays?: number }): void {
    if (!this.modal) {
      return;
    }

    const { type, user } = this.modal;

    if (type === 'suspend') {
      this.adminService.suspendUser(user.id, data).subscribe({
        next: () => {
          this.user.status = 'suspended';
        },
        error: (error) => {
          console.error('Failed to suspend user', error);
        }
      }
      );
    } else {
      this.adminService.banUser(user.id, data).subscribe(() => {
        this.user.status = 'banned';
      });
    }

    this.modal = null;
  }

  closeModal(): void {
    this.modal = null;
  }

  getInitials(name: string): string {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  }

  hashString(str: string): number {
    let hash = 0;

    for (let i = 0; i < str.length; i++) {
      hash = str.charCodeAt(i) + ((hash << 5) - hash);
    }

    return Math.abs(hash);
  }

  getUserGradient(seed: string): string {
    const hash = this.hashString(seed);

    const hue1 = hash % 360;
    const hue2 = (hue1 + 40) % 360; // small shift for gradient

    return `linear-gradient(135deg, 
      hsl(${hue1}, 70%, 55%), 
      hsl(${hue2}, 70%, 45%)
    )`;
  }

  get profileIdentifier(): string {
    return this.user.handle || this.user.name;
  }

  get roleBadgeClass(): string {
    if (this.user.role === 'admin') {
      return 'bg-red-50 text-red-700 border border-red-200';
    }

    return 'bg-slate-100 text-slate-700 border border-slate-200';
  }

  formatRelative(value: string): string {
    const timestamp = new Date(value).getTime();
    if (Number.isNaN(timestamp)) {
      return 'Unknown';
    }

    const diffInMinutes = Math.floor((Date.now() - timestamp) / 60_000);

    if (diffInMinutes < 1) {
      return 'Just now';
    }

    if (diffInMinutes < 60) {
      return `${diffInMinutes}m ago`;
    }

    const diffInHours = Math.floor(diffInMinutes / 60);
    if (diffInHours < 24) {
      return `${diffInHours}h ago`;
    }

    const diffInDays = Math.floor(diffInHours / 24);
    if (diffInDays < 30) {
      return `${diffInDays}d ago`;
    }

    if (diffInDays < 365) {
      return `${Math.floor(diffInDays / 30)}mo ago`;
    }

    return `${Math.floor(diffInDays / 365)}y ago`;
  }

  onCheckboxChange(checked: boolean): void {
    this.toggle.emit({ id: this.user.id, checked });
  }
}
