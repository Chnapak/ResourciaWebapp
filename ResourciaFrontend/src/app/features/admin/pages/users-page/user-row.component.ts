import { Component, EventEmitter, Input, Output } from '@angular/core';
import { TableRowBase } from '../../components/table-row-base';
import { AdminUser } from '../../models/admin-user.model';
import { Router, RouterLink, RouterModule } from '@angular/router';
import { DropdownComponent, DropdownItem } from '../../../../shared/ui/dropdown/dropdown.component';
import { NgStyle } from '@angular/common';
import { ReasonModalComponent } from '../../components/reason-modal/reason-modal.component';


@Component({
  selector: 'app-user-row',
  imports: [ RouterLink, DropdownComponent, NgStyle, ReasonModalComponent ],
  standalone: true,
  templateUrl: './user-row.component.html',
  styleUrl: './user-row.component.scss'
})
export class UserRowComponent extends TableRowBase {
  @Input({ required: true }) user!: AdminUser;
  @Input() selected = false;

  @Output() toggle = new EventEmitter<{ id: string; checked: boolean }>();

  modal: { type: 'suspend' | 'ban'; user: any } | null = null;

  constructor(private router: Router) {
    super()
  }

  get userMenuItems(): DropdownItem[] {
  const items: DropdownItem[] = [
    {
      type: 'action',
      label: 'View Profile',
      action: () => this.viewUser()
    },
    {
      type: 'divider'
    }
  ];

  if (this.user.status === 'active') {
    items.push(
      {
        type: 'action',
        label: 'Suspend',
        action: () => this.suspendUser(),
        danger: true
      },
      {
        type: 'action',
        label: 'Ban',
        action: () => this.banUser(),
        danger: true
      },
    );
  }
  else if (this.user.status === 'suspended') {
    items.push(
      {
        type: 'action',
        label: 'Unsuspend',
        action: () => this.unsuspendUser(),
        danger: true
      },
      {
        type: 'action',
        label: 'Ban',
        action: () => this.banUser(),
        danger: true
      },
    );
  }
  else {
    items.push(
      {
        type: 'action',
        label: 'Unban',
        action: () => this.unbanUser(),
        danger: true
      },
    );
  }
    return items;
  }

  viewUser() {
    let username = this.user.name;
    console.log(this.user)
    const url = this.router.serializeUrl(
      this.router.createUrlTree([`../../profile/${username}`])
    );
    window.open(url, '_blank');
  }

  suspendUser() {
    this.openModal('suspend', this.user);
  }

  unsuspendUser() {
    console.log(`Unsuspending user ${this.user.name}`);
  }

  banUser() {
    this.openModal('ban', this.user);
  }

  unbanUser() {
    console.log(`Unbanning user ${this.user.name}`);
  }

  openModal(type: 'suspend' | 'ban', user: any) {
    this.modal = { type, user };
  }

  handleConfirm(data: { reason: string; duration?: string }) {
    console.log('Confirmed:', data);
    this.modal = null;
  }

  closeModal() {
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

  onCheckboxChange(ev: Event) {
    this.toggle.emit({ id: this.user.id, checked: this.getChecked(ev) });
  }
}
