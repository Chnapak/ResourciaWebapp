import { Component, EventEmitter, Input, Output } from '@angular/core';
import { AdminFilter } from '../../models/admin-filter.model';
import { TableRowBase } from '../../components/table-row-base';
import { FilterKind } from '../../../../shared/models/filter-kind';
import { CheckboxComponent } from '../../../../shared/ui/checkbox/checkbox.component';
import { FormsModule } from '@angular/forms';
import { DropdownComponent, DropdownItem } from '../../../../shared/ui/dropdown/dropdown.component';
import { DatePipe } from '@angular/common';

@Component({
  selector: 'app-filter-row',
  imports: [ CheckboxComponent, FormsModule, DropdownComponent, DatePipe ],
  standalone: true,
  templateUrl: './filter-row.component.html',
  styleUrl: './filter-row.component.scss'
})
export class FilterRowComponent extends TableRowBase {
  @Input({ required: true }) filter!: AdminFilter;
  @Input() index = 0;
  @Input() selected = false;

  @Output() toggle = new EventEmitter<{ id: string; checked: boolean }>();

  filterMenuItems: DropdownItem[] = [
    { type: 'action', label: 'Edit', action: () => this.editFilter() },
    { type: 'action', label: 'Toggle Status', action: () => this.toggleFilter() },
    { type: 'divider' },
    { type: 'action', label: 'Delete', action: () => this.deleteFilter(), danger: true },
  ];

  FilterKind = FilterKind;

  editFilter() {
    console.log('Edit filter', this.filter);
  }

  toggleFilter() {
    console.log('Toggle filter status', this.filter);
  }

  deleteFilter() {
    console.log('Delete filter', this.filter);
  }

  onCheckboxChange(ev: Event) {
    this.toggle.emit({ id: this.filter.id, checked: this.getChecked(ev) });
  }
}
