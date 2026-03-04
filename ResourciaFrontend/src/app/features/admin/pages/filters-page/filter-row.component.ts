import { Component, EventEmitter, Input, Output } from '@angular/core';
import { AdminFilter } from '../../models/admin-filter.model';
import { TableRowBase } from '../../components/table-row-base';
import { FilterKind } from '../../../../shared/models/filter-kind';
import { CheckboxComponent } from '../../../../shared/ui/checkbox/checkbox.component';
import { FormsModule } from '@angular/forms';
import { DropdownComponent, DropdownItem } from '../../../../shared/ui/dropdown/dropdown.component';
import { DatePipe } from '@angular/common';
import { CdkDragHandle } from '@angular/cdk/drag-drop';

@Component({
  selector: 'app-filter-row',
  imports: [ CheckboxComponent, FormsModule, DropdownComponent, DatePipe, CdkDragHandle],
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

  hashString(str: string): number {
    let hash = 0;

    for (let i = 0; i < str.length; i++) {
      hash = str.charCodeAt(i) + ((hash << 5) - hash);
    }

    return Math.abs(hash);
  }

  getFilterGradient(seed: string): string {
    const hash = this.hashString(seed);

    const hue1 = hash % 360;
    const hue2 = (hue1 + 40) % 360; // small shift for gradient

    return `linear-gradient(135deg, 
      hsl(${hue1}, 70%, 55%), 
      hsl(${hue2}, 70%, 45%)
    )`;
  }

  onCheckboxChange(ev: Event) {
    this.toggle.emit({ id: this.filter.id, checked: this.getChecked(ev) });
  }
}
