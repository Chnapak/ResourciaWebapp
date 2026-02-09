import { Component, EventEmitter, Input, Output } from '@angular/core';
import { AdminHeaderComponent } from '../admin-header/admin-header.component';
import { AdminTableHeaderComponent } from './components/admin-table-header/admin-table-header.component';
import { AdminTableColumn } from '../../models/admin-table.types';

@Component({
  selector: 'app-admin-table',
  imports: [ AdminTableHeaderComponent ],
  standalone: true,
  templateUrl: './admin-table.component.html',
  styleUrl: './admin-table.component.scss'
})
export class AdminTableComponent {
  @Input({ required: true }) columns: AdminTableColumn[] = [];

  @Input() selectable = false;
  @Input() checked = false;
  @Input() indeterminate = false;

  @Output() toggleAll = new EventEmitter<boolean>();
}
