import { CommonModule } from '@angular/common';
import { Component, OnInit, inject } from '@angular/core';
import { AbstractControl, ReactiveFormsModule, UntypedFormBuilder, ValidationErrors, ValidatorFn, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { ResourceService } from '../../../../core/services/resource.service';
import { SearchService } from '../../../../core/services/search.service';
import { CreateResourceRequestModel } from '../../../../shared/models/create-resource-request';
import { FilterKind } from '../../../../shared/models/filter-kind';
import { Filter as SearchSchemaFilter } from '../../../../shared/models/search-schema';

type DirectResourceField = 'author' | 'isFree' | 'learningStyle' | 'rating' | 'tags' | 'year';

@Component({
  selector: 'app-add-resource-page',
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  templateUrl: './add-resource-page.component.html',
  styleUrl: './add-resource-page.component.scss'
})
export class AddResourcePageComponent implements OnInit {
  protected readonly FilterKind = FilterKind;

  private readonly fb = inject(UntypedFormBuilder);
  private readonly resourceService = inject(ResourceService);
  private readonly searchService = inject(SearchService);
  private readonly router = inject(Router);

  private readonly featuredFilterKeys = new Set([
    'subject',
    'type',
    'resourcetype',
    'resource-type',
    'format',
  ]);

  readonly resourceForm = this.fb.group({
    title: ['', [Validators.required]],
    url: ['', [Validators.required, this.resourceUrlValidator()]],
    description: [''],
  });

  schemaFilters: SearchSchemaFilter[] = [];
  filtersLoading = true;
  submitting = false;
  error: string | null = null;

  ngOnInit(): void {
    this.loadSchema();
  }

  get featuredFilters(): SearchSchemaFilter[] {
    return this.schemaFilters.filter((filter) => this.isFeaturedFilter(filter));
  }

  get optionalFilters(): SearchSchemaFilter[] {
    return this.schemaFilters.filter((filter) => !this.isFeaturedFilter(filter));
  }

  get titleControl(): AbstractControl | null {
    return this.resourceForm.get('title');
  }

  get urlControl(): AbstractControl | null {
    return this.resourceForm.get('url');
  }

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

  getFilterControlName(filter: SearchSchemaFilter): string {
    return `schema_${filter.key.replace(/[^a-zA-Z0-9]+/g, '_').toLowerCase()}`;
  }

  getFilterControl(filter: SearchSchemaFilter): AbstractControl | null {
    return this.resourceForm.get(this.getFilterControlName(filter));
  }

  hasFacetOptions(filter: SearchSchemaFilter): boolean {
    return (filter.values?.length ?? 0) > 0;
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

    this.searchService.schema().subscribe({
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

      if (filter.kind === FilterKind.Facet && filter.isMulti) {
        this.resourceForm.addControl(controlName, this.fb.control([]));
        return;
      }

      this.resourceForm.addControl(controlName, this.fb.control(''));
    });
  }

  private buildPayload(): CreateResourceRequestModel {
    const payload: CreateResourceRequestModel = {
      title: this.resourceForm.get('title')?.value.trim(),
      url: this.normalizeUrl(this.resourceForm.get('url')?.value),
      description: this.toNullableString(this.resourceForm.get('description')?.value),
      facets: this.buildFacetPayload(),
    };

    return {
      ...payload,
      ...this.buildDirectFieldPayload(),
    };
  }

  private buildFacetPayload(): Record<string, string[]> {
    return this.schemaFilters.reduce<Record<string, string[]>>((facets, filter) => {
      if (filter.kind !== FilterKind.Facet) {
        return facets;
      }

      const rawValue = this.getFilterControl(filter)?.value;
      const values = Array.isArray(rawValue)
        ? rawValue.filter((value): value is string => typeof value === 'string' && value.trim().length > 0)
        : this.toNullableString(rawValue)
          ? [rawValue.trim()]
          : [];

      if (values.length > 0) {
        facets[filter.key] = values;
      }

      return facets;
    }, {});
  }

  private buildDirectFieldPayload(): Partial<CreateResourceRequestModel> {
    const payload: Partial<CreateResourceRequestModel> = {};

    this.schemaFilters.forEach((filter) => {
      if (filter.kind === FilterKind.Facet) {
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

  private isSupportedFilter(filter: SearchSchemaFilter): boolean {
    return filter.kind === FilterKind.Facet || this.getDirectFieldKey(filter.resourceField) !== null;
  }

  private isFeaturedFilter(filter: SearchSchemaFilter): boolean {
    return this.featuredFilterKeys.has(filter.key.toLowerCase());
  }

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

  private normalizeUrl(value: string): string {
    const trimmed = value.trim();
    if (/^https?:\/\//i.test(trimmed)) {
      return trimmed;
    }

    return `https://${trimmed}`;
  }

  private toNullableInteger(value: unknown): number | null {
    const parsed = Number.parseInt(String(value ?? '').trim(), 10);
    return Number.isNaN(parsed) ? null : parsed;
  }

  private toNullableNumber(value: unknown): number | null {
    const parsed = Number.parseFloat(String(value ?? '').trim());
    return Number.isNaN(parsed) ? null : parsed;
  }

  private toNullableString(value: unknown): string | null {
    if (typeof value !== 'string') {
      return null;
    }

    const trimmed = value.trim();
    return trimmed || null;
  }

  private toStringList(value: unknown): string[] {
    return String(value ?? '')
      .split(',')
      .map((item) => item.trim())
      .filter((item) => item.length > 0);
  }
}
