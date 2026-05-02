/**
 * Admin page for creating, editing, and reordering filters.
 */
import { Component, inject, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { FilterKind } from '../../../../shared/models/filter-kind';
import { AdminHeaderComponent } from '../../components/admin-header/admin-header.component';
import { AdminTableColumn } from '../../models/admin-table.types';
import { AdminTableComponent } from '../../components/admin-table/admin-table.component';
import { FilterRowComponent } from './filter-row.component';
import { AdminFilter } from '../../models/admin-filter.model';
import { AdminService } from '../../../../core/services/admin.service';
import { CdkDragDrop, DragDropModule, moveItemInArray } from '@angular/cdk/drag-drop';
import { AdminFilterReorderModel } from '../../models/admin-filter-reorder.model';
import { ToasterService } from '../../../../shared/toaster/toaster.service';
import { AdminFilterCreateModel } from '../../models/admin-filter-create.model';

@Component({
  selector: 'app-filters',
  imports: [AdminHeaderComponent, AdminTableComponent, FilterRowComponent, DragDropModule, FormsModule],
  templateUrl: './filters-page.component.html',
  styleUrl: './filters-page.component.scss'
})
/**
 * Hosts the admin filter list with inline editing and creation panels.
 */
export class FiltersAdminPageComponent implements OnInit {
  /** Column definitions for the filter table. */
  columns: AdminTableColumn[] = [
    { key: 'filter', label: $localize`Filter`, widthClass: 'flex-1' },
    { key: 'type', label: $localize`Type`, widthClass: 'w-32' },
    { key: 'resources', label: $localize`Resources`, widthClass: 'w-40' },
    { key: 'lastUpdated', label: $localize`Last Updated`, widthClass: 'w-28' },
    { key: 'status', label: $localize`Status`, widthClass: 'w-28' },
    { key: 'actions', label: '', widthClass: 'w-20', align: 'right' },
  ];

  /** Options shown in the "kind" selector for filter creation. */
  readonly kindOptions = [
    { value: FilterKind.Facet, label: 'Facet' },
    { value: FilterKind.Range, label: 'Range' },
    { value: FilterKind.Boolean, label: 'Boolean' },
    { value: FilterKind.Text, label: 'Text' }
  ];

  /** Selected filter ids for bulk actions. */
  selectedKeys = new Set<string>();
  /** Current filter schema loaded from the server. */
  schema: AdminFilter[] = [];
  /** Loading state for filters list. */
  isLoading = false;
  /** Exposes the enum to the template. */
  FilterKind = FilterKind;

  /** Whether the create panel is visible. */
  isCreatePanelOpen = false;
  /** Whether a create request is in progress. */
  isCreating = false;
  /** Draft model used for the create form. */
  createDraft = this.createEmptyDraft();

  /** Tracks whether the key field has been manually edited. */
  private createKeyTouched = false;

  /** Admin API client used by the page. */
  protected readonly AdminService = inject(AdminService);
  /** Toast notifier for validation and API feedback. */
  private readonly toaster = inject(ToasterService);

  /** True when all rows are selected. */
  get allSelected(): boolean {
    return this.schema.length > 0 && this.selectedKeys.size === this.schema.length;
  }

  /** True when some rows are selected but not all. */
  get someSelected(): boolean {
    return this.selectedKeys.size > 0 && !this.allSelected;
  }

  /** Whether the create form is in a facet-kind mode. */
  get usesFacetValues(): boolean {
    return this.createDraft.kind === FilterKind.Facet;
  }

  /** Loads filters on component initialization. */
  ngOnInit(): void {
    this.loadFilters();
  }

  /** Toggles selection for all rows. */
  onToggleAll(checked: boolean): void {
    if (checked) {
      this.schema.forEach(filter => this.selectedKeys.add(filter.id));
      return;
    }

    this.selectedKeys.clear();
  }

  /** Toggles selection for a single filter. */
  onToggleOne(filterId: string, checked: boolean): void {
    if (checked) {
      this.selectedKeys.add(filterId);
      return;
    }

    this.selectedKeys.delete(filterId);
  }

  /** Removes a deleted filter from the local list. */
  onDeleteFilter(filterId: string): void {
    this.schema = this.schema.filter((filter) => filter.id !== filterId);
    this.selectedKeys.delete(filterId);
  }

  /** Opens the create panel and resets the draft fields. */
  openCreatePanel(): void {
    this.isCreatePanelOpen = true;
    this.resetCreateDraft();
  }

  /** Cancels creation and clears draft state. */
  cancelCreate(): void {
    this.isCreatePanelOpen = false;
    this.isCreating = false;
    this.resetCreateDraft();
  }

  /** Updates the key draft when the label changes and the key is untouched. */
  onCreateLabelChange(): void {
    if (!this.createKeyTouched) {
      this.createDraft.key = this.generateFilterKey(this.createDraft.label);
    }
  }

  /** Marks the key as manually edited to prevent auto-overwrites. */
  onCreateKeyChange(): void {
    this.createKeyTouched = this.createDraft.key.trim().length > 0;
  }

  /** Applies defaults when the filter kind changes. */
  onCreateKindChange(): void {
    if (this.createDraft.kind === FilterKind.Facet) {
      this.createDraft.isMulti = true;

      if (this.createDraft.facetValues.length === 0) {
        this.createDraft.facetValues = [{ label: '' }];
      }

      return;
    }

    this.createDraft.isMulti = false;
    this.createDraft.resourceField = null;
    this.createDraft.facetValues = [];
  }

  /** Adds an empty facet value row to the create draft. */
  addCreateFacetValue(): void {
    this.createDraft.facetValues = [...this.createDraft.facetValues, { label: '' }];
  }

  /** Removes a draft facet value by index. */
  removeCreateFacetValue(index: number): void {
    this.createDraft.facetValues = this.createDraft.facetValues
      .filter((_value, currentIndex) => currentIndex !== index);
  }

  /** Validates and submits the create filter request. */
  saveCreate(): void {
    const label = this.createDraft.label.trim();
    const key = this.createDraft.key.trim();

    if (!label) {
      this.toaster.show('Filter name is required.', 'error');
      return;
    }

    if (!key) {
      this.toaster.show('Filter key is required.', 'error');
      return;
    }

    const trimmedFacetValues = this.createDraft.facetValues
      .map(facetValue => ({ label: facetValue.label.trim() }))
      .filter(facetValue => facetValue.label.length > 0);

    const duplicateFacetValues = trimmedFacetValues
      .map(facetValue => facetValue.label.toLowerCase())
      .filter((facetValue, index, values) => values.indexOf(facetValue) !== index);

    if (duplicateFacetValues.length > 0) {
      this.toaster.show('Facet values must be unique.', 'error');
      return;
    }

    if (this.createDraft.isActive && this.createDraft.kind === FilterKind.Facet && trimmedFacetValues.length === 0) {
      this.toaster.show('Active facet filters need at least one possible value.', 'error');
      return;
    }

    const payload: AdminFilterCreateModel = {
      key,
      label,
      description: this.createDraft.description?.trim() || null,
      kind: this.createDraft.kind,
      isMulti: this.createDraft.kind === FilterKind.Facet ? this.createDraft.isMulti : false,
      isActive: this.createDraft.isActive,
      resourceField: null,
      facetValues: this.createDraft.kind === FilterKind.Facet ? trimmedFacetValues : []
    };

    this.isCreating = true;

    this.AdminService.createFilter(payload).subscribe({
      next: () => {
        this.isCreating = false;
        this.isCreatePanelOpen = false;
        this.resetCreateDraft();
        this.loadFilters();
        this.toaster.show('Filter created.', 'success');
      },
      error: (err) => {
        this.isCreating = false;
        console.error('Failed to create filter', err);
        this.toaster.show(this.extractErrorMessage(err) ?? 'Failed to create filter.', 'error');
      }
    });
  }

  /** Handles drag-and-drop reorder events and persists the new order. */
  drop(event: CdkDragDrop<any[]>): void {
    if (event.previousIndex === event.currentIndex) return;

    const fromIndex = event.previousIndex;
    const toIndex = event.currentIndex;
    const moved = this.schema[fromIndex];

    moveItemInArray(this.schema, fromIndex, toIndex);

    const above = toIndex > 0 ? this.schema[toIndex - 1] : null;
    const below = toIndex < this.schema.length - 1 ? this.schema[toIndex + 1] : null;

    const payload: AdminFilterReorderModel = {
      movedId: moved.id,
      aboveId: above?.id ?? null,
      belowId: below?.id ?? null,
    };

    this.AdminService.reorderFilters(payload).subscribe();
  }

  /** Provides contextual help for the selected filter kind. */
  getCreateKindDescription(): string {
    switch (this.createDraft.kind) {
      case FilterKind.Facet:
        return 'Adds a selectable list of predefined values such as Subject or Difficulty.';
      case FilterKind.Range:
        return 'Filters a numeric field using min and max bounds, for example Year.';
      case FilterKind.Boolean:
        return 'Filters a true or false field such as Uses AI.';
      case FilterKind.Text:
        return 'Filters a searchable text field such as Author or Title.';
      default:
        return '';
    }
  }

  /** Returns the label for the currently selected filter kind. */
  getCreateKindLabel(): string {
    return this.kindOptions.find((kind) => kind.value === this.createDraft.kind)?.label ?? 'Filter';
  }

  /** Loads filters and reconciles the current selection set. */
  private loadFilters(): void {
    this.isLoading = true;
    this.AdminService.getFilters().subscribe({
      next: (data: AdminFilter[]) => {
        this.schema = data;

        const validIds = new Set(data.map(filter => filter.id));
        this.selectedKeys = new Set([...this.selectedKeys].filter(id => validIds.has(id)));
        this.isLoading = false;
      },
      error: (err) => {
        console.error('Failed to load filters', err);
        this.schema = [];
        this.selectedKeys.clear();
        this.isLoading = false;
      }
    });
  }

  /** Resets the create draft to default values. */
  private resetCreateDraft(): void {
    this.createDraft = this.createEmptyDraft();
    this.createKeyTouched = false;
  }

  /** Creates a blank create draft with sensible defaults. */
  private createEmptyDraft(): AdminFilterCreateModel {
    return {
      key: '',
      label: '',
      description: null,
      kind: FilterKind.Facet,
      isMulti: true,
      isActive: true,
      resourceField: null,
      facetValues: [{ label: '' }]
    };
  }

  /** Generates a normalized filter key from a label. */
  private generateFilterKey(value: string): string {
    return value
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')
      .slice(0, 64);
  }

  /** Extracts a user-friendly error message from an API error. */
  private extractErrorMessage(err: unknown): string | null {
    if (!err || typeof err !== 'object') return null;

    const maybeError = err as {
      error?: string | { error?: string; title?: string };
      message?: string;
    };

    if (typeof maybeError.error === 'string') {
      return maybeError.error;
    }

    if (typeof maybeError.error === 'object' && maybeError.error) {
      return maybeError.error.error ?? maybeError.error.title ?? null;
    }

    return maybeError.message ?? null;
  }
}
