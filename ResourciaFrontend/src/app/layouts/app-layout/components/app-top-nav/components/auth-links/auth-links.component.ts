import { Component, EventEmitter, Input, Output } from '@angular/core';
import { MeInfoModel } from '../../../../../../shared/models/me-info';
import { Router, RouterLink } from '@angular/router';
import { Dropdown } from 'flowbite';
import { DropdownComponent, DropdownItem } from '../../../../../../shared/ui/dropdown/dropdown.component';

@Component({
  selector: 'app-auth-links',
  imports: [ RouterLink, DropdownComponent ],
  templateUrl: './auth-links.component.html',
  styleUrl: './auth-links.component.scss'
})
export class AuthLinksComponent {
  @Input() user: MeInfoModel | null = null;
  @Output() logout = new EventEmitter<void>();

  constructor(private router: Router) {}

  get userMenuItems(): DropdownItem[] {
    const items: DropdownItem[] = [
      {
        type: 'action',
        label: 'Profile',
        action: () => this.viewUser()
      }
    ];

    if (this.user?.isAdmin) {
      items.push({
        type: 'action',
        label: 'Admin',
        link: '/admin'
      });
    }

    items.push(
      { type: 'divider' },
      {
        type: 'action',
        label: 'Logout',
        action: () => this.onLogoutClick(),
        danger: true
      }
    );

    return items;
  }

  viewUser() {
    if (this.user) {
      let username = this.user.name;
      const url = this.router.serializeUrl(
        this.router.createUrlTree([`../../profile/${username}`])
      );
      window.open(url, '_blank');
    }
  }

  upgradeUser() {
    console.log('Upgrade user');
  }

  deactivateUser() {
    console.log('Deactivate user');
  }

  onLogoutClick(): void {
  this.logout.emit();
}
}
