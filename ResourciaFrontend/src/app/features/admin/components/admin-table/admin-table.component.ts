/**
 * Reusable admin table wrapper that renders headers and selection state.
 */
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
/**
 * Hosts the admin table header and exposes selection controls.
 */
export class AdminTableComponent {
  /** Column definitions used to render the table header. */
  @Input({ required: true }) columns: AdminTableColumn[] = [];

  /** Enables the "select all" checkbox. */
  @Input() selectable = false;
  /** Whether all rows are currently selected. */
  @Input() checked = false;
  /** Whether the select-all checkbox should be indeterminate. */
  @Input() indeterminate = false;

  /** Emits when the select-all checkbox changes. */
  @Output() toggleAll = new EventEmitter<boolean>();
}
