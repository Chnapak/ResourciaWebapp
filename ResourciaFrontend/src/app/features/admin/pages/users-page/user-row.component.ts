import { Component, EventEmitter, Input, Output } from '@angular/core';
import { TableRowBase } from '../../components/table-row-base';
import { AdminUser } from '../../models/admin-user.model';
import { RouterLink } from '@angular/router';


@Component({
  selector: 'app-user-row',
  imports: [ RouterLink ],
  standalone: true,
  templateUrl: './user-row.component.html',
  styleUrl: './user-row.component.scss'
})
export class UserRowComponent extends TableRowBase {
  @Input({ required: true }) user!: AdminUser;
  @Input() selected = false;

  @Output() toggle = new EventEmitter<{ id: string; checked: boolean }>();

  onCheckboxChange(ev: Event) {
    this.toggle.emit({ id: this.user.id, checked: this.getChecked(ev) });
  }
}
