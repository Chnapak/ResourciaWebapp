import { Component, EventEmitter, Input, Output } from '@angular/core';
import { FilterKind } from '../../../../../../shared/models/filter-kind';
import { FiltersSectionComponent } from '../filters-section/filters-section.component';

@Component({
  selector: 'app-filters-sidebar',
  imports: [FiltersSectionComponent],
  templateUrl: './filters-sidebar.component.html',
  styleUrl: './filters-sidebar.component.scss',
})
export class FiltersSidebarComponent {
  @Input() filters: any[] = [];
  @Input() collapsedMap: Record<string,boolean> = {};
  @Input() facetState: Record<string, string | string[]> = {};
  @Input() rangeState: Record<string, { min?: string; max?: string }> = {};
  @Input() booleanState: Record<string, boolean> = {};
  @Input() textState: Record<string, string> = {};

  @Output() toggleSection = new EventEmitter<string>();
  @Output() facetChange = new EventEmitter<{ filter: any; value: string | string[] | null}>();
  @Output() rangeChange = new EventEmitter<{ filter: any; type: 'min' | 'max'; value: string }>();
  @Output() booleanChange = new EventEmitter<{ filter: any; value: boolean }>();
  @Output() textChange = new EventEmitter<{ filter: any; value: string }>();
  @Output() clearAll = new EventEmitter<void>();

  readonly FilterKind = FilterKind;

  isCollapsed(key: string): boolean {
    return this.collapsedMap[key] ?? true;
  }
}
