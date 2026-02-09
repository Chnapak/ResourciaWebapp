import { Component, EventEmitter, Input, Output } from '@angular/core';
import { AdminFilter } from '../../models/admin-filter.model';
import { TableRowBase } from '../../components/table-row-base';
import { FilterKind } from '../../../../shared/models/filter-kind';

@Component({
  selector: 'app-filter-row',
  imports: [],
  standalone: true,
  templateUrl: './filter-row.component.html',
  styleUrl: './filter-row.component.scss'
})
export class FilterRowComponent extends TableRowBase {
  @Input({ required: true }) filter!: AdminFilter;
  @Input() selected = false;

  @Output() toggle = new EventEmitter<{ id: string; checked: boolean }>();

  FilterKind = FilterKind;

  onCheckboxChange(ev: Event) {
    this.toggle.emit({ id: this.filter.id, checked: this.getChecked(ev) });
  }
}
