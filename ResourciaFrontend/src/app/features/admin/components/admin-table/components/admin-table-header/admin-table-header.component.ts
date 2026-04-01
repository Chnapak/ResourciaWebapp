/**
 * Header row component for admin tables with optional selection support.
 */
import { Component, EventEmitter, Input, Output } from '@angular/core';
import { AdminTableColumn } from '../../../../models/admin-table.types';

@Component({
  selector: 'app-admin-table-header',
  imports: [],
  templateUrl: './admin-table-header.component.html',
  styleUrl: './admin-table-header.component.scss'
})
/**
 * Renders column headings and a select-all checkbox when enabled.
 */
export class AdminTableHeaderComponent {
  /** Column definitions for the header cells. */
  @Input({ required: true }) columns: AdminTableColumn[] = [];

  /** Enables the select-all checkbox column. */
  @Input() selectable = false;
  /** Whether all rows are currently selected. */
  @Input() checked = false;
  /** Whether the select-all checkbox should show a mixed state. */
  @Input() indeterminate = false;
  /** Emits the next checked state when the checkbox toggles. */
  @Output() toggleAll = new EventEmitter<boolean>();

  /** Handles the select-all checkbox change event. */
  toggleSelectAll(ev: Event): void {
    const checked = (ev.target as HTMLInputElement).checked;
    this.toggleAll.emit(checked);
  }
}
