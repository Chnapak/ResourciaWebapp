import { CommonModule } from '@angular/common';
import { Component, OnInit, inject } from '@angular/core';
import { AbstractControl, ReactiveFormsModule, UntypedFormBuilder, ValidationErrors, ValidatorFn, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { ResourceService } from '../../../../core/services/resource.service';
import { CreateResourceRequestModel } from '../../../../shared/models/create-resource-request';
import { FilterKind } from '../../../../shared/models/filter-kind';
import { Filter as SearchSchemaFilter } from '../../../../shared/models/search-schema';

/**
 * Resource fields that map directly to request properties (non-facet).
 */
type DirectResourceField = 'author' | 'isFree' | 'learningStyle' | 'rating' | 'tags' | 'year';

/**
 * Page for submitting a new resource and optional filter metadata.
 */
@Component({
  selector: 'app-add-resource-page',
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  templateUrl: './add-resource-page.component.html',
  styleUrl: './add-resource-page.component.scss'
})
export class AddResourcePageComponent implements OnInit {
  /** Expose enum to template for switch/case rendering. */
  protected readonly FilterKind = FilterKind;

  /** Form builder for the resource form. */
  private readonly fb = inject(UntypedFormBuilder);
  /** API service used to create resources and load schema. */
  private readonly resourceService = inject(ResourceService);
  /** Router used for post-submit navigation. */
  private readonly router = inject(Router);

  /** Priority filter keys surfaced at the top of the form. */
  private readonly featuredFilterKeys = new Set([
    'subject',
    'type',
    'resourcetype',
    'resource-type',
    'format',
  ]);

  /** Base form group for required resource fields. */
  readonly resourceForm = this.fb.group({
    title: ['', [Validators.required]],
    url: ['', [Validators.required, this.resourceUrlValidator()]],
    description: [''],
  });

  /** Filters returned by the backend schema. */
  schemaFilters: SearchSchemaFilter[] = [];
  /** Loading state for schema-driven filters. */
  filtersLoading = true;
  /** Submission state for the create request. */
  submitting = false;
  /** Error message for schema or submit failures. */
  error: string | null = null;

  /** Load schema metadata on page init. */
  ngOnInit(): void {
    this.loadSchema();
  }

  /** Filters shown in the "featured" group. */
  get featuredFilters(): SearchSchemaFilter[] {
    return this.schemaFilters.filter((filter) => this.isFeaturedFilter(filter));
  }

  /** Remaining optional filters. */
  get optionalFilters(): SearchSchemaFilter[] {
    return this.schemaFilters.filter((filter) => !this.isFeaturedFilter(filter));
  }

  /** Shortcut to the title control. */
  get titleControl(): AbstractControl | null {
    return this.resourceForm.get('title');
  }

  /** Shortcut to the url control. */
  get urlControl(): AbstractControl | null {
    return this.resourceForm.get('url');
  }

  /** Submit the form payload to the API. */
  submit(): void {
    if (this.resourceForm.invalid) {
      this.resourceForm.markAllAsTouched();
      return;
    }

    this.submitting = true;
    this.error = null;

    this.resourceService.createResource(this.buildPayload()).subscribe({
      next: (resource) => {
        this.submitting = false;
        this.router.navigate(['/resource', resource.id]);
      },
      error: (err) => {
        this.submitting = false;
        this.error = err?.error?.error ?? 'Failed to create resource.';
      },
    });
  }

  /** Build a stable control name for a schema filter. */
  getFilterControlName(filter: SearchSchemaFilter): string {
    return `schema_${filter.key.replace(/[^a-zA-Z0-9]+/g, '_').toLowerCase()}`;
  }

  /** Fetch the control for a schema filter if present. */
  getFilterControl(filter: SearchSchemaFilter): AbstractControl | null {
    return this.resourceForm.get(this.getFilterControlName(filter));
  }

  /** Convenience check for facet options. */
  hasFacetOptions(filter: SearchSchemaFilter): boolean {
    return (filter.values?.length ?? 0) > 0;
  }

  /** Whether the filter uses selectable values (facet with options). */
  usesSelectableValues(filter: SearchSchemaFilter): boolean {
    return filter.kind === FilterKind.Facet && this.hasFacetOptions(filter);
  }

  /** Whether values should be stored in filterValues instead of direct fields. */
  usesStoredFilterValues(filter: SearchSchemaFilter): boolean {
    return filter.kind === FilterKind.Facet || this.getDirectFieldKey(filter.resourceField) === null;
  }

  /** Check if a facet value is currently selected in the form control. */
  isFacetValueSelected(filter: SearchSchemaFilter, value: string): boolean {
    const selectedValues = this.getFilterControl(filter)?.value;
    return Array.isArray(selectedValues) && selectedValues.includes(value);
  }

  /** Toggle a facet value in a multi-select control. */
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

  /** Input type for filters rendered as freeform inputs. */
  getInputType(filter: SearchSchemaFilter): 'number' | 'text' {
    return filter.kind === FilterKind.Range ? 'number' : 'text';
  }

  /** Placeholder text for the filter input. */
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

  /** Fetch the resource schema and sync form controls. */
  private loadSchema(): void {
    this.filtersLoading = true;

    this.resourceService.getResourceSchema().subscribe({
      next: (schema) => {
        this.schemaFilters = (schema.filters ?? []).filter((filter) => this.isSupportedFilter(filter));
        this.syncSchemaControls();
        this.filtersLoading = false;
      },
      error: () => {
        this.schemaFilters = [];
        this.filtersLoading = false;
        this.error = 'Failed to load optional filters.';
      },
    });
  }

  /** Ensure form controls exist for the active schema filters. */
  private syncSchemaControls(): void {
    const activeControls = new Set(this.schemaFilters.map((filter) => this.getFilterControlName(filter)));

    Object.keys(this.resourceForm.controls)
      .filter((controlName) => controlName.startsWith('schema_') && !activeControls.has(controlName))
      .forEach((controlName) => this.resourceForm.removeControl(controlName));

    this.schemaFilters.forEach((filter) => {
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

  /** Build the API payload from the form values. */
  private buildPayload(): CreateResourceRequestModel {
    const payload: CreateResourceRequestModel = {
      title: this.resourceForm.get('title')?.value.trim(),
      url: this.normalizeUrl(this.resourceForm.get('url')?.value),
      description: this.toNullableString(this.resourceForm.get('description')?.value),
      filterValues: this.buildFilterValuePayload(),
    };

    return {
      ...payload,
      ...this.buildDirectFieldPayload(),
    };
  }

  /** Build the filterValues map for schema filters. */
  private buildFilterValuePayload(): Record<string, string[]> {
    return this.schemaFilters.reduce<Record<string, string[]>>((filterValues, filter) => {
      if (!this.usesStoredFilterValues(filter)) {
        return filterValues;
      }

      const rawValue = this.getFilterControl(filter)?.value;
      let values: string[] = [];

      if (filter.kind === FilterKind.Facet) {
        values = Array.isArray(rawValue)
          ? rawValue.filter((value): value is string => typeof value === 'string' && value.trim().length > 0)
          : this.toNullableString(rawValue)
            ? [rawValue.trim()]
            : [];
      } else {
        const singleValue = this.toNullableString(rawValue);
        values = singleValue ? [singleValue] : [];
      }

      if (values.length > 0) {
        filterValues[filter.key] = values;
      }

      return filterValues;
    }, {});
  }

  /** Build direct resource fields from non-facet filters. */
  private buildDirectFieldPayload(): Partial<CreateResourceRequestModel> {
    const payload: Partial<CreateResourceRequestModel> = {};

    this.schemaFilters.forEach((filter) => {
      if (filter.kind === FilterKind.Facet) {
        return;
      }

      if (this.usesStoredFilterValues(filter)) {
        return;
      }

      const directField = this.getDirectFieldKey(filter.resourceField);
      if (!directField) {
        return;
      }

      const rawValue = this.getFilterControl(filter)?.value;

      switch (directField) {
        case 'author':
        case 'learningStyle': {
          const value = this.toNullableString(rawValue);
          if (value) {
            payload[directField] = value;
          }
          break;
        }
        case 'isFree': {
          if (rawValue === 'true') {
            payload.isFree = true;
          } else if (rawValue === 'false') {
            payload.isFree = false;
          }
          break;
        }
        case 'rating': {
          const value = this.toNullableNumber(rawValue);
          if (value !== null) {
            payload.rating = value;
          }
          break;
        }
        case 'tags': {
          const value = this.toStringList(rawValue);
          if (value.length > 0) {
            payload.tags = value;
          }
          break;
        }
        case 'year': {
          const value = this.toNullableInteger(rawValue);
          if (value !== null) {
            payload.year = value;
          }
          break;
        }
      }
    });

    return payload;
  }

  /** Determine whether a schema filter is supported by this form. */
  private isSupportedFilter(filter: SearchSchemaFilter): boolean {
    return filter.kind === FilterKind.Facet
      || this.getDirectFieldKey(filter.resourceField) !== null
      || !filter.resourceField;
  }

  /** Determine whether a filter should be featured at the top. */
  private isFeaturedFilter(filter: SearchSchemaFilter): boolean {
    return this.featuredFilterKeys.has(filter.key.toLowerCase());
  }

  /** Map schema resourceField values to direct request fields. */
  private getDirectFieldKey(resourceField: string | null): DirectResourceField | null {
    switch (resourceField?.toLowerCase()) {
      case 'author':
        return 'author';
      case 'isfree':
        return 'isFree';
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

  /** Validate URL values and normalize missing protocol. */
  private resourceUrlValidator(): ValidatorFn {
    return (control: AbstractControl): ValidationErrors | null => {
      const value = this.toNullableString(control.value);
      if (!value) {
        return null;
      }

      try {
        new URL(this.normalizeUrl(value));
        return null;
      } catch {
        return { invalidUrl: true };
      }
    };
  }

  /** Normalize URLs by ensuring a protocol prefix. */
  private normalizeUrl(value: string): string {
    const trimmed = value.trim();
    if (/^https?:\/\//i.test(trimmed)) {
      return trimmed;
    }

    return `https://${trimmed}`;
  }

  /** Parse a nullable integer from user input. */
  private toNullableInteger(value: unknown): number | null {
    const parsed = Number.parseInt(String(value ?? '').trim(), 10);
    return Number.isNaN(parsed) ? null : parsed;
  }

  /** Parse a nullable float from user input. */
  private toNullableNumber(value: unknown): number | null {
    const parsed = Number.parseFloat(String(value ?? '').trim());
    return Number.isNaN(parsed) ? null : parsed;
  }

  /** Trim a string and convert empty values to null. */
  private toNullableString(value: unknown): string | null {
    if (typeof value !== 'string') {
      return null;
    }

    const trimmed = value.trim();
    return trimmed || null;
  }

  /** Convert a comma-separated string into a list of trimmed values. */
  private toStringList(value: unknown): string[] {
    return String(value ?? '')
      .split(',')
      .map((item) => item.trim())
      .filter((item) => item.length > 0);
  }
}
