import { Component, EventEmitter, Input, Output } from '@angular/core';
import { TableRowBase } from '../../components/table-row-base';
import { AdminUser } from '../../models/admin-user.model';
import { Router, RouterLink } from '@angular/router';
import { DropdownComponent, DropdownItem } from '../../../../shared/ui/dropdown/dropdown.component';


@Component({
  selector: 'app-user-row',
  imports: [ RouterLink, DropdownComponent ],
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


  onCheckboxChange(ev: Event) {
    this.toggle.emit({ id: this.user.id, checked: this.getChecked(ev) });
  }
}
