import { Component, EventEmitter, Input, Output } from '@angular/core';
import { TableRowBase } from '../../components/table-row-base';
import { AdminUser } from '../../models/admin-user.model';
import { Router, RouterLink } from '@angular/router';
import { DropdownComponent, DropdownItem } from '../../../../shared/ui/dropdown/dropdown.component';
import { NgStyle } from '@angular/common';


@Component({
  selector: 'app-user-row',
  imports: [ RouterLink, DropdownComponent, NgStyle ],
  standalone: true,
  templateUrl: './user-row.component.html',
  styleUrl: './user-row.component.scss'
})
export class UserRowComponent extends TableRowBase {
  @Input({ required: true }) user!: AdminUser;
  @Input() selected = false;

  @Output() toggle = new EventEmitter<{ id: string; checked: boolean }>();

  constructor(private router: Router) {
    super()
  }

  userMenuItems: DropdownItem[] = [
  {
    type: 'action',
    label: 'View Profile',
    action: () => this.viewUser()
  },
  {
    type: 'action',
    label: 'Upgrade to Pro',
    action: () => this.upgradeUser()
  },
  {
    type: 'divider'
  },
  {
    type: 'action',
    label: 'Deactivate',
    action: () => this.deactivateUser(),
    danger: true
  }
  ];

  viewUser() {
    let username = this.user.name;
    console.log(this.user)
    const url = this.router.serializeUrl(
      this.router.createUrlTree([`../../profile/${username}`])
    );
    window.open(url, '_blank');
  }

  upgradeUser() {
    console.log('Upgrade user');
  }

  deactivateUser() {
    console.log('Deactivate user');
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
