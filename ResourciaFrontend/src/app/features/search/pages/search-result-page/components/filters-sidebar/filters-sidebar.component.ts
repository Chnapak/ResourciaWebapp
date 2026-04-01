import { Component, EventEmitter, Input, Output } from '@angular/core';
import { FilterKind } from '../../../../../../shared/models/filter-kind';
import { FiltersSectionComponent } from '../filters-section/filters-section.component';

/**
 * Sidebar container that renders all search filter sections.
 */
@Component({
  selector: 'app-filters-sidebar',
  imports: [FiltersSectionComponent],
  templateUrl: './filters-sidebar.component.html',
  styleUrl: './filters-sidebar.component.scss',
})
export class FiltersSidebarComponent {
  /** List of filters from the schema. */
  @Input() filters: any[] = [];
  /** Collapsed state keyed by filter key. */
  @Input() collapsedMap: Record<string,boolean> = {};
  /** Current facet filter values. */
  @Input() facetState: Record<string, string | string[]> = {};
  /** Current range filter values. */
  @Input() rangeState: Record<string, { min?: string; max?: string }> = {};
  /** Current boolean filter values. */
  @Input() booleanState: Record<string, boolean> = {};
  /** Current text filter values. */
  @Input() textState: Record<string, string> = {};

  /** Toggle a section open/closed. */
  @Output() toggleSection = new EventEmitter<string>();
  /** Emit updated facet values. */
  @Output() facetChange = new EventEmitter<{ filter: any; value: string | string[] | null}>();
  /** Emit updated range values. */
  @Output() rangeChange = new EventEmitter<{ filter: any; type: 'min' | 'max'; value: string }>();
  /** Emit updated boolean values. */
  @Output() booleanChange = new EventEmitter<{ filter: any; value: boolean }>();
  /** Emit updated text values. */
  @Output() textChange = new EventEmitter<{ filter: any; value: string }>();
  /** Clear all filters. */
  @Output() clearAll = new EventEmitter<void>();

  /** Expose enum to template. */
  readonly FilterKind = FilterKind;

  /** Read collapsed state with a default of true. */
  isCollapsed(key: string): boolean {
    return this.collapsedMap[key] ?? true;
  }
}
