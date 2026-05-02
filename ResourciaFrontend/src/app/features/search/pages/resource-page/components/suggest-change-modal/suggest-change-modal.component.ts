import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, OnChanges, OnInit, Output, SimpleChanges, inject } from '@angular/core';
import { AbstractControl, ReactiveFormsModule, UntypedFormBuilder, Validators } from '@angular/forms';
import { ResourceService } from '../../../../../../core/services/resource.service';
import { FilterKind } from '../../../../../../shared/models/filter-kind';
import { FacetModel } from '../../../../../../shared/models/facet';
import { ResourceDetailModel } from '../../../../../../shared/models/resource-detail';
import { Filter as SearchSchemaFilter } from '../../../../../../shared/models/search-schema';
import { UpdateResourceRequestModel } from '../../../../../../shared/models/update-resource-request';
import { deriveIsFreeFromFilterValues } from '../../../../../../shared/utils/monetization.utils';

type DirectResourceField = 'author' | 'learningStyle' | 'rating' | 'tags' | 'year';

@Component({
  selector: 'app-suggest-change-modal',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './suggest-change-modal.component.html',
  styleUrl: './suggest-change-modal.component.scss',
})
export class SuggestChangeModalComponent implements OnInit, OnChanges {
  protected readonly FilterKind = FilterKind;

  @Input() resource: ResourceDetailModel | null = null;
  @Input() isSubmitting = false;
  @Output() close = new EventEmitter<void>();
  @Output() submitChanges = new EventEmitter<UpdateResourceRequestModel>();

  private readonly fb = inject(UntypedFormBuilder);
  private readonly resourceService = inject(ResourceService);

  private readonly featuredFilterKeys = new Set([
    'subject',
    'type',
    'resourcetype',
    'resource-type',
    'format',
    'monetization',
  ]);

  readonly resourceForm = this.fb.group({
    title: ['', [Validators.required]],
    description: [''],
    author: [''],
    learningStyle: [''],
    year: [''],
    tags: [''],
  });

  schemaFilters: SearchSchemaFilter[] = [];
  filtersLoading = true;
  schemaError: string | null = null;
  submitError: string | null = null;

  ngOnInit(): void {
    this.loadSchema();
    this.applyResourceToForm();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['resource']) {
      this.applyResourceToForm();
      this.applyResourceFacetsToFilters();
    }
  }

  get titleControl(): AbstractControl | null {
    return this.resourceForm.get('title');
  }

  get featuredFilters(): SearchSchemaFilter[] {
    return this.editableSchemaFilters.filter((filter) => this.featuredFilterKeys.has(filter.key.toLowerCase()));
  }

  get optionalFilters(): SearchSchemaFilter[] {
    return this.editableSchemaFilters.filter((filter) => !this.featuredFilterKeys.has(filter.key.toLowerCase()));
  }

  get editableSchemaFilters(): SearchSchemaFilter[] {
    return this.schemaFilters.filter((filter) => this.isEditableSchemaFilter(filter));
  }

  submit(): void {
    if (this.resourceForm.invalid) {
      this.resourceForm.markAllAsTouched();
      return;
    }

    const payload = this.buildPayload();
    if (!payload) {
      this.submitError = 'No changes detected.';
      return;
    }

    this.submitError = null;
    this.submitChanges.emit(payload);
  }

  getFilterControlName(filter: SearchSchemaFilter): string {
    return `schema_${filter.key.replace(/[^a-zA-Z0-9]+/g, '_').toLowerCase()}`;
  }

  getFilterControl(filter: SearchSchemaFilter): AbstractControl | null {
    return this.resourceForm.get(this.getFilterControlName(filter));
  }

  hasFacetOptions(filter: SearchSchemaFilter): boolean {
    return (filter.values?.length ?? 0) > 0;
  }

  usesSelectableValues(filter: SearchSchemaFilter): boolean {
    return filter.kind === FilterKind.Facet && this.hasFacetOptions(filter);
  }

  usesStoredFilterValues(filter: SearchSchemaFilter): boolean {
    return filter.kind === FilterKind.Facet || this.getDirectFieldKey(filter.resourceField) === null;
  }

  isFacetValueSelected(filter: SearchSchemaFilter, value: string): boolean {
    const selectedValues = this.getFilterControl(filter)?.value;
    return Array.isArray(selectedValues) && selectedValues.includes(value);
  }

  toggleFacetValue(filter: SearchSchemaFilter, value: string, checked: boolean): void {
    const control = this.getFilterControl(filter);
    if (!control) {
      return;
    }

    const currentValues = Array.isArray(control.value) ? [...control.value] : [];
    const nextValues = checked
      ? [...new Set([...currentValues, value])]
      : currentValues.filter((item) => item !== value);

    control.setValue(nextValues);
    control.markAsDirty();
    control.markAsTouched();
  }

  getInputType(filter: SearchSchemaFilter): 'number' | 'text' {
    return filter.kind === FilterKind.Range ? 'number' : 'text';
  }

  getInputPlaceholder(filter: SearchSchemaFilter): string {
    if (filter.kind === FilterKind.Range) {
      return filter.resourceField?.toLowerCase() === 'year'
        ? 'Enter a year'
        : `Enter ${filter.label.toLowerCase()}`;
    }

    if (this.getDirectFieldKey(filter.resourceField) === 'tags') {
      return 'Comma-separated values';
    }

    return `Enter ${filter.label.toLowerCase()}`;
  }

  private loadSchema(): void {
    this.filtersLoading = true;
    this.schemaError = null;

    this.resourceService.getResourceSchema().subscribe({
      next: (schema) => {
        this.schemaFilters = (schema.filters ?? []).filter((filter) => this.isSupportedFilter(filter));
        this.syncSchemaControls();
        this.applyResourceFacetsToFilters();
        this.filtersLoading = false;
      },
      error: () => {
        this.schemaFilters = [];
        this.filtersLoading = false;
        this.schemaError = 'Failed to load filter metadata.';
      },
    });
  }

  private syncSchemaControls(): void {
    const activeControls = new Set(this.editableSchemaFilters.map((filter) => this.getFilterControlName(filter)));

    Object.keys(this.resourceForm.controls)
      .filter((controlName) => controlName.startsWith('schema_') && !activeControls.has(controlName))
      .forEach((controlName) => this.resourceForm.removeControl(controlName));

    this.editableSchemaFilters.forEach((filter) => {
      const controlName = this.getFilterControlName(filter);
      if (this.resourceForm.contains(controlName)) {
        return;
      }

      if (this.usesSelectableValues(filter) && filter.isMulti) {
        this.resourceForm.addControl(controlName, this.fb.control([]));
        return;
      }

      this.resourceForm.addControl(controlName, this.fb.control(''));
    });
  }

  private applyResourceToForm(): void {
    if (!this.resource) {
      return;
    }

    this.resourceForm.patchValue({
      title: this.resource.title ?? '',
      description: this.resource.description ?? '',
      author: this.resource.author ?? '',
      learningStyle: this.resource.learningStyle ?? '',
      year: this.resource.year ? String(this.resource.year) : '',
      tags: Array.isArray(this.resource.tags) ? this.resource.tags.join(', ') : '',
    }, { emitEvent: false });
  }

  private applyResourceFacetsToFilters(): void {
    if (!this.resource || this.editableSchemaFilters.length === 0) {
      return;
    }

    this.editableSchemaFilters.forEach((filter) => {
      const values = this.getResourceFacetValues(filter.key, this.resource?.facets ?? []);
      const control = this.getFilterControl(filter);
      if (!control) {
        return;
      }

      if (values.length === 0) {
        return;
      }

      if (filter.kind === FilterKind.Facet && filter.isMulti) {
        control.setValue(values);
        return;
      }

      control.setValue(values[0] ?? '');
    });
  }

  private buildPayload(): UpdateResourceRequestModel | null {
    if (!this.resource) {
      return null;
    }

    const payload: UpdateResourceRequestModel = {};

    const titleValue = this.normalizeForCompare(this.resourceForm.get('title')?.value);
    if (titleValue !== this.normalizeForCompare(this.resource.title)) {
      payload.title = titleValue;
    }

    const descriptionValue = this.normalizeForCompare(this.resourceForm.get('description')?.value);
    if (descriptionValue !== this.normalizeForCompare(this.resource.description)) {
      payload.description = descriptionValue;
    }

    const authorValue = this.normalizeForCompare(this.resourceForm.get('author')?.value);
    if (authorValue !== this.normalizeForCompare(this.resource.author)) {
      payload.author = authorValue;
    }

    const learningStyleValue = this.normalizeForCompare(this.resourceForm.get('learningStyle')?.value);
    if (learningStyleValue !== this.normalizeForCompare(this.resource.learningStyle)) {
      payload.learningStyle = learningStyleValue;
    }

    const yearValue = this.toNullableInteger(this.resourceForm.get('year')?.value);
    if (yearValue !== (this.resource.year ?? null)) {
      payload.year = yearValue;
    }

    const tagValues = this.toStringList(this.resourceForm.get('tags')?.value);
    if (!this.areStringArraysEqual(tagValues, this.resource.tags ?? [])) {
      payload.tags = tagValues;
    }

    const filterValues = this.buildFilterValuePayload();
    const resourceFilterValues = this.buildResourceFilterValues();
    if (!this.areFilterValuesEqual(filterValues, resourceFilterValues)) {
      payload.filterValues = filterValues;
    }

    const derivedIsFree = deriveIsFreeFromFilterValues(filterValues);
    if (derivedIsFree !== null && derivedIsFree !== (this.resource.isFree ?? null)) {
      payload.isFree = derivedIsFree;
    }

    return Object.keys(payload).length > 0 ? payload : null;
  }

  private buildFilterValuePayload(): Record<string, string[]> {
    return this.editableSchemaFilters.reduce<Record<string, string[]>>((filterValues, filter) => {
      if (!this.usesStoredFilterValues(filter)) {
        return filterValues;
      }

      const rawValue = this.getFilterControl(filter)?.value;
      let values: string[] = [];

      if (filter.kind === FilterKind.Facet) {
        values = Array.isArray(rawValue)
          ? rawValue.filter((value): value is string => typeof value === 'string' && value.trim().length > 0)
          : this.normalizeForCompare(rawValue)
            ? [this.normalizeForCompare(rawValue)]
            : [];
      } else {
        const singleValue = this.normalizeForCompare(rawValue);
        values = singleValue ? [singleValue] : [];
      }

      if (values.length > 0) {
        filterValues[filter.key] = values;
      }

      return filterValues;
    }, {});
  }

  private buildResourceFilterValues(): Record<string, string[]> {
    const filters = this.editableSchemaFilters.map((filter) => filter.key.toLowerCase());
    const valuesByKey: Record<string, string[]> = {};

    (this.resource?.facets ?? []).forEach((facet) => {
      if (!filters.includes(facet.key.toLowerCase())) {
        return;
      }

      const key = facet.key;
      if (!valuesByKey[key]) {
        valuesByKey[key] = [];
      }
      valuesByKey[key].push(facet.value);
    });

    return valuesByKey;
  }

  private getResourceFacetValues(key: string, facets: FacetModel[]): string[] {
    return facets
      .filter((facet) => facet.key.toLowerCase() === key.toLowerCase())
      .map((facet) => facet.value);
  }

  private areFilterValuesEqual(
    left: Record<string, string[]>,
    right: Record<string, string[]>
  ): boolean {
    const normalize = (value: Record<string, string[]>) => {
      const normalized: Record<string, string[]> = {};
      Object.entries(value).forEach(([key, values]) => {
        const normalizedKey = key.toLowerCase();
        normalized[normalizedKey] = [...new Set(values.map((v) => v.trim().toLowerCase()))].sort();
      });
      return normalized;
    };

    const normalizedLeft = normalize(left);
    const normalizedRight = normalize(right);
    const leftKeys = Object.keys(normalizedLeft).sort();
    const rightKeys = Object.keys(normalizedRight).sort();

    if (leftKeys.length !== rightKeys.length) {
      return false;
    }

    for (let i = 0; i < leftKeys.length; i += 1) {
      if (leftKeys[i] !== rightKeys[i]) {
        return false;
      }

      const leftValues = normalizedLeft[leftKeys[i]] ?? [];
      const rightValues = normalizedRight[rightKeys[i]] ?? [];
      if (leftValues.length !== rightValues.length) {
        return false;
      }

      for (let j = 0; j < leftValues.length; j += 1) {
        if (leftValues[j] !== rightValues[j]) {
          return false;
        }
      }
    }

    return true;
  }

  private areStringArraysEqual(left: string[], right: string[]): boolean {
    const normalize = (values: string[]) =>
      [...new Set(values.map((value) => value.trim().toLowerCase()).filter((value) => value.length > 0))].sort();

    const leftValues = normalize(left);
    const rightValues = normalize(right);

    if (leftValues.length !== rightValues.length) {
      return false;
    }

    for (let i = 0; i < leftValues.length; i += 1) {
      if (leftValues[i] !== rightValues[i]) {
        return false;
      }
    }

    return true;
  }

  private isSupportedFilter(filter: SearchSchemaFilter): boolean {
    return filter.kind === FilterKind.Facet
      || this.getDirectFieldKey(filter.resourceField) !== null
      || !filter.resourceField;
  }

  private isEditableSchemaFilter(filter: SearchSchemaFilter): boolean {
    if (!this.isSupportedFilter(filter)) {
      return false;
    }

    const resourceField = filter.resourceField?.toLowerCase();
    if (!resourceField) {
      return true;
    }

    if (resourceField === 'url' || resourceField === 'createdby' || resourceField === 'createdatutc'
      || resourceField === 'updatedatutc' || resourceField === 'savescount') {
      return false;
    }

    return this.getDirectFieldKey(filter.resourceField) === null;
  }

  private getDirectFieldKey(resourceField: string | null): DirectResourceField | null {
    switch (resourceField?.toLowerCase()) {
      case 'author':
        return 'author';
      case 'learningstyle':
        return 'learningStyle';
      case 'rating':
        return 'rating';
      case 'tags':
        return 'tags';
      case 'year':
        return 'year';
      default:
        return null;
    }
  }

  private normalizeForCompare(value: unknown): string {
    return String(value ?? '').trim();
  }

  private toNullableInteger(value: unknown): number | null {
    const parsed = Number.parseInt(String(value ?? '').trim(), 10);
    return Number.isNaN(parsed) ? null : parsed;
  }

  private toStringList(value: unknown): string[] {
    return String(value ?? '')
      .split(',')
      .map((item) => item.trim())
      .filter((item) => item.length > 0);
  }
}
