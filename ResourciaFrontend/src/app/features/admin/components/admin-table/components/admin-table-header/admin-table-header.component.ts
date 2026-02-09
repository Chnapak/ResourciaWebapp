import { Component, EventEmitter, Input, Output } from '@angular/core';
import { AdminTableColumn } from '../../../../models/admin-table.types';

@Component({
  selector: 'app-admin-table-header',
  imports: [],
  templateUrl: './admin-table-header.component.html',
  styleUrl: './admin-table-header.component.scss'
})
export class AdminTableHeaderComponent {
  @Input({ required: true }) columns: AdminTableColumn[] = [];

  @Input() selectable = false;
  @Input() checked = false;
  @Input() indeterminate = false;
  @Output() toggleAll = new EventEmitter<boolean>();

  toggleSelectAll(ev: Event): void {
    const checked = (ev.target as HTMLInputElement).checked;
    this.toggleAll.emit(checked);
  }
}
