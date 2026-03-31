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
export class FiltersAdminPageComponent implements OnInit {
  columns: AdminTableColumn[] = [
    { key: 'filter', label: $localize`Filter`, widthClass: 'flex-1' },
    { key: 'type', label: $localize`Type`, widthClass: 'w-32' },
    { key: 'resources', label: $localize`Resources`, widthClass: 'w-40' },
    { key: 'lastUpdated', label: $localize`Last Updated`, widthClass: 'w-28' },
    { key: 'status', label: $localize`Status`, widthClass: 'w-28' },
    { key: 'actions', label: '', widthClass: 'w-20', align: 'right' },
  ];

  readonly kindOptions = [
    { value: FilterKind.Facet, label: 'Facet' },
    { value: FilterKind.Range, label: 'Range' },
    { value: FilterKind.Boolean, label: 'Boolean' },
    { value: FilterKind.Text, label: 'Text' }
  ];

  selectedKeys = new Set<string>();
  schema: AdminFilter[] = [];
  FilterKind = FilterKind;

  isCreatePanelOpen = false;
  isCreating = false;
  createDraft = this.createEmptyDraft();

  private createKeyTouched = false;

  protected readonly AdminService = inject(AdminService);
  private readonly toaster = inject(ToasterService);

  get allSelected(): boolean {
    return this.schema.length > 0 && this.selectedKeys.size === this.schema.length;
  }

  get someSelected(): boolean {
    return this.selectedKeys.size > 0 && !this.allSelected;
  }

  get usesFacetValues(): boolean {
    return this.createDraft.kind === FilterKind.Facet;
  }

  ngOnInit(): void {
    this.loadFilters();
  }

  onToggleAll(checked: boolean): void {
    if (checked) {
      this.schema.forEach(filter => this.selectedKeys.add(filter.id));
      return;
    }

    this.selectedKeys.clear();
  }

  onToggleOne(filterId: string, checked: boolean): void {
    if (checked) {
      this.selectedKeys.add(filterId);
      return;
    }

    this.selectedKeys.delete(filterId);
  }

  openCreatePanel(): void {
    this.isCreatePanelOpen = true;
    this.resetCreateDraft();
  }

  cancelCreate(): void {
    this.isCreatePanelOpen = false;
    this.isCreating = false;
    this.resetCreateDraft();
  }

  onCreateLabelChange(): void {
    if (!this.createKeyTouched) {
      this.createDraft.key = this.generateFilterKey(this.createDraft.label);
    }
  }

  onCreateKeyChange(): void {
    this.createKeyTouched = this.createDraft.key.trim().length > 0;
  }

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

  addCreateFacetValue(): void {
    this.createDraft.facetValues = [...this.createDraft.facetValues, { label: '' }];
  }

  removeCreateFacetValue(index: number): void {
    this.createDraft.facetValues = this.createDraft.facetValues
      .filter((_value, currentIndex) => currentIndex !== index);
  }

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

  getCreateKindDescription(): string {
    switch (this.createDraft.kind) {
      case FilterKind.Facet:
        return 'Adds a selectable list of predefined values such as Subject or Difficulty.';
      case FilterKind.Range:
        return 'Filters a numeric field using min and max bounds, for example Year.';
      case FilterKind.Boolean:
        return 'Filters a true or false field such as IsFree.';
      case FilterKind.Text:
        return 'Filters a searchable text field such as Author or Title.';
      default:
        return '';
    }
  }

  getCreateKindLabel(): string {
    return this.kindOptions.find((kind) => kind.value === this.createDraft.kind)?.label ?? 'Filter';
  }

  private loadFilters(): void {
    this.AdminService.getFilters().subscribe((data: AdminFilter[]) => {
      this.schema = data;

      const validIds = new Set(data.map(filter => filter.id));
      this.selectedKeys = new Set([...this.selectedKeys].filter(id => validIds.has(id)));
    });
  }

  private resetCreateDraft(): void {
    this.createDraft = this.createEmptyDraft();
    this.createKeyTouched = false;
  }

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

  private generateFilterKey(value: string): string {
    return value
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')
      .slice(0, 64);
  }

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
