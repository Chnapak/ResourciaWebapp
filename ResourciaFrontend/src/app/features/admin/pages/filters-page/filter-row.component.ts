/**
 * Row component for managing a single admin filter entry.
 */
import { Component, EventEmitter, inject, Input, Output } from '@angular/core';
import { AdminFilter } from '../../models/admin-filter.model';
import { TableRowBase } from '../../components/table-row-base';
import { FilterKind } from '../../../../shared/models/filter-kind';
import { CheckboxComponent } from '../../../../shared/ui/checkbox/checkbox.component';
import { FormsModule } from '@angular/forms';
import { DropdownComponent, DropdownItem } from '../../../../shared/ui/dropdown/dropdown.component';
import { DatePipe, LowerCasePipe } from '@angular/common';
import { CdkDragHandle } from '@angular/cdk/drag-drop';
import { AdminService } from '../../../../core/services/admin.service';
import { ToasterService } from '../../../../shared/toaster/toaster.service';
import { AdminFilterUpdateModel } from '../../models/admin-filter-update.model';

/**
 * Editable copy of a facet value used in the inline editor.
 */
interface EditableFacetValue {
  /** Optional id for existing facet values. */
  id?: string;
  /** Display label for the facet value. */
  label: string;
}

@Component({
  selector: 'app-filter-row',
  imports: [CheckboxComponent, FormsModule, DropdownComponent, DatePipe, LowerCasePipe, CdkDragHandle],
  standalone: true,
  templateUrl: './filter-row.component.html',
  styleUrl: './filter-row.component.scss'
})
/**
 * Presents a filter row with inline editing and moderation actions.
 */
export class FilterRowComponent extends TableRowBase {
  /** Admin API client for filter operations. */
  private readonly filtersService = inject(AdminService);
  /** Toast notifier for validation and API feedback. */
  private readonly toaster = inject(ToasterService);

  /** Filter data bound to this row. */
  @Input({ required: true }) filter!: AdminFilter;
  /** Index of the row in the list (used for display). */
  @Input() index = 0;
  /** Whether this row is currently selected. */
  @Input() selected = false;

  /** Emits a selection toggle for bulk actions. */
  @Output() toggle = new EventEmitter<{ id: string; checked: boolean }>();
  /** Emits when the filter is deleted successfully. */
  @Output() deleted = new EventEmitter<string>();

  /** Whether the row is currently in edit mode. */
  isEditing = false;
  /** Whether an update request is in progress. */
  isSaving = false;

  /** Draft label while editing. */
  editLabel = '';
  /** Draft description while editing. */
  editDescription = '';
  /** Draft facet values while editing. */
  editFacetValues: EditableFacetValue[] = [];

  /** Context menu actions for the row. */
  readonly filterMenuItems: DropdownItem[] = [
    { type: 'action', label: 'Edit', action: () => this.editFilter() },
    { type: 'action', label: 'Toggle Status', action: () => this.toggleFilter() },
    { type: 'divider' },
    { type: 'action', label: 'Delete', action: () => this.deleteFilter(), danger: true }
  ];

  /** Exposes the enum to the template for kind checks. */
  FilterKind = FilterKind;

  /** Enters edit mode and hydrates the draft fields. */
  editFilter(): void {
    this.isEditing = true;
    this.hydrateDraft();
  }

  /** Cancels editing and resets draft values. */
  cancelEdit(): void {
    this.isEditing = false;
    this.isSaving = false;
    this.hydrateDraft();
  }

  /** Validates input and persists filter changes to the backend. */
  saveEdit(): void {
    const trimmedLabel = this.editLabel.trim();

    if (!trimmedLabel) {
      this.toaster.show('Filter name is required.', 'error');
      return;
    }

    const trimmedFacetValues = this.editFacetValues
      .map((facetValue) => ({
        id: facetValue.id,
        label: facetValue.label.trim()
      }))
      .filter((facetValue) => facetValue.label.length > 0);

    const duplicateFacetValues = trimmedFacetValues
      .map((facetValue) => facetValue.label.toLowerCase())
      .filter((label, index, labels) => labels.indexOf(label) !== index);

    if (duplicateFacetValues.length > 0) {
      this.toaster.show('Facet values must be unique.', 'error');
      return;
    }

    if (this.filter.kind === FilterKind.Facet && this.filter.isActive && trimmedFacetValues.length === 0) {
      this.toaster.show('Active facet filters need at least one possible value.', 'error');
      return;
    }

    const payload: AdminFilterUpdateModel = {
      label: trimmedLabel,
      description: this.editDescription.trim() || null,
      facetValues: trimmedFacetValues
    };

    this.isSaving = true;

    this.filtersService.updateFilter(this.filter.id, payload).subscribe({
      next: (updatedFilter) => {
        Object.assign(this.filter, updatedFilter);
        this.isEditing = false;
        this.isSaving = false;
        this.hydrateDraft();
        this.toaster.show('Filter updated.', 'success');
      },
      error: (err) => {
        this.isSaving = false;
        console.error('Failed to update filter', err);
        this.toaster.show('Failed to update filter.', 'error');
      }
    });
  }

  /** Adds a new empty facet value row to the draft list. */
  addFacetValue(): void {
    this.editFacetValues = [...this.editFacetValues, { label: '' }];
  }

  /** Removes a draft facet value by index. */
  removeFacetValue(index: number): void {
    this.editFacetValues = this.editFacetValues.filter((_value, currentIndex) => currentIndex !== index);
  }

  /** Toggles the filter's active state on the server. */
  toggleFilter(): void {
    this.filtersService.toggleActiveFilters(this.filter.id).subscribe({
      next: (updatedFilter) => {
        this.filter.isActive = updatedFilter.isActive;
      },
      error: (err) => {
        console.error('Failed to toggle filter', err);
        this.toaster.show('Failed to toggle filter.', 'error');
      }
    });
  }

  /** Confirms and deletes the filter on the server. */
  deleteFilter(): void {
    const confirmed = window.confirm(`Delete "${this.filter.label}"? Disabled filters can still be restored in the database, but this will remove it from the admin list.`);
    if (!confirmed) {
      return;
    }

    this.filtersService.deleteFilter(this.filter.id).subscribe({
      next: () => {
        this.deleted.emit(this.filter.id);
        this.toaster.show('Filter deleted.', 'success');
      },
      error: (err) => {
        console.error('Failed to delete filter', err);
        this.toaster.show('Failed to delete filter.', 'error');
      }
    });
  }

  /** Generates a stable hash from a string for UI coloring. */
  hashString(str: string): number {
    let hash = 0;

    for (let i = 0; i < str.length; i++) {
      hash = str.charCodeAt(i) + ((hash << 5) - hash);
    }

    return Math.abs(hash);
  }

  /** Builds a two-tone gradient based on a string seed. */
  getFilterGradient(seed: string): string {
    const hash = this.hashString(seed);

    const hue1 = hash % 360;
    const hue2 = (hue1 + 40) % 360;

    return `linear-gradient(135deg,
      hsl(${hue1}, 70%, 55%),
      hsl(${hue2}, 70%, 45%)
    )`;
  }

  /** Emits selection changes for the row checkbox. */
  onCheckboxChange(checked: boolean): void {
    this.toggle.emit({ id: this.filter.id, checked });
  }

  /** Copies the current filter values into the editable draft fields. */
  private hydrateDraft(): void {
    this.editLabel = this.filter.label ?? '';
    this.editDescription = this.filter.description ?? '';
    this.editFacetValues = this.filter.facetValues.map((facetValue) => ({
      id: facetValue.id,
      label: facetValue.label
    }));
  }
}
