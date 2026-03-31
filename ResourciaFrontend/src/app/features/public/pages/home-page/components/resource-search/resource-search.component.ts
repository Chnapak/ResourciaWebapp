import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { SearchService } from '../../../../../../core/services/search.service';
import { Filter as SearchSchemaFilter, FilterValue } from '../../../../../../shared/models/search-schema';
import { FilterKind } from '../../../../../../shared/models/filter-kind';

type HomeFilterControlType = 'select' | 'text';

interface HomeSearchFilter {
  key: string;
  label: string;
  kind: FilterKind;
  controlType: HomeFilterControlType;
  emptyOptionLabel?: string;
  placeholder?: string;
  options: FilterValue[];
}

@Component({
  selector: 'app-resource-search',
  imports: [CommonModule, FormsModule],
  templateUrl: './resource-search.component.html',
  styleUrl: './resource-search.component.scss'
})
export class ResourceSearchComponent implements OnInit {
  readonly homeFilterLimit = 3;

  filters: HomeSearchFilter[] = [];
  formValues: Record<string, string> = {};
  isSchemaLoading = true;

  constructor(
    private router: Router,
    private searchService: SearchService
  ) {}

  ngOnInit(): void {
    this.searchService.schema().subscribe({
      next: (schema) => {
        this.filters = this.pickHomeFilters(schema.filters);
        this.formValues = this.filters.reduce<Record<string, string>>((accumulator, filter) => {
          accumulator[filter.key] = '';
          return accumulator;
        }, {});
        this.isSchemaLoading = false;
      },
      error: () => {
        this.filters = [];
        this.formValues = {};
        this.isSchemaLoading = false;
      }
    });
  }

  onSearch(): void {
    const queryParams: Record<string, string> = {};

    for (const filter of this.filters) {
      const rawValue = this.formValues[filter.key] ?? '';
      const value = rawValue.trim();

      if (!value) {
        continue;
      }

      if (filter.kind === FilterKind.Boolean) {
        if (value === 'true') {
          queryParams[filter.key] = 'true';
        }

        continue;
      }

      queryParams[filter.key] = value;
    }

    this.router.navigate(['/search'], { queryParams });
  }

  private pickHomeFilters(filters: SearchSchemaFilter[]): HomeSearchFilter[] {
    const available = filters.filter((filter) => this.isEligibleHomeFilter(filter));
    const selected: SearchSchemaFilter[] = [];

    this.addPreferredFilter(selected, available, (filter) =>
      filter.kind === FilterKind.Facet && this.matchesFilter(filter, ['subject']));

    this.addPreferredFilter(selected, available, (filter) =>
      filter.kind === FilterKind.Text && this.matchesFilter(filter, ['author']));

    this.addPreferredFilter(selected, available, (filter) =>
      filter.kind === FilterKind.Boolean && this.matchesFilter(filter, ['isfree', 'price', 'cost']));

    this.addPreferredFilter(selected, available, (filter) =>
      filter.kind === FilterKind.Facet && this.matchesFilter(filter, ['type', 'resourcetype', 'resource-type', 'format']));

    this.addPreferredFilter(selected, available, (filter) =>
      filter.kind === FilterKind.Facet && this.matchesFilter(filter, ['difficulty', 'level']));

    this.addPreferredFilter(selected, available, (filter) => filter.kind === FilterKind.Facet);
    this.addPreferredFilter(selected, available, (filter) => filter.kind === FilterKind.Text);
    this.addPreferredFilter(selected, available, (filter) => filter.kind === FilterKind.Boolean);

    return selected
      .slice(0, this.homeFilterLimit)
      .map((filter) => this.toHomeFilter(filter));
  }

  private addPreferredFilter(
    selected: SearchSchemaFilter[],
    available: SearchSchemaFilter[],
    predicate: (filter: SearchSchemaFilter) => boolean
  ): void {
    if (selected.length >= this.homeFilterLimit) {
      return;
    }

    const index = available.findIndex(predicate);
    if (index < 0) {
      return;
    }

    selected.push(available[index]);
    available.splice(index, 1);
  }

  private isEligibleHomeFilter(filter: SearchSchemaFilter): boolean {
    switch (filter.kind) {
      case FilterKind.Facet:
        return filter.values.length > 0;
      case FilterKind.Text:
      case FilterKind.Boolean:
        return true;
      default:
        return false;
    }
  }

  private matchesFilter(filter: SearchSchemaFilter, identifiers: string[]): boolean {
    const normalizedKey = this.normalizeIdentifier(filter.key);
    const normalizedField = this.normalizeIdentifier(filter.resourceField);

    return identifiers.some((identifier) => {
      const normalizedIdentifier = this.normalizeIdentifier(identifier);
      return normalizedIdentifier === normalizedKey || normalizedIdentifier === normalizedField;
    });
  }

  private toHomeFilter(filter: SearchSchemaFilter): HomeSearchFilter {
    switch (filter.kind) {
      case FilterKind.Text:
        return {
          key: filter.key,
          label: this.toDisplayLabel(filter, 'Search'),
          kind: filter.kind,
          controlType: 'text',
          placeholder: this.toTextPlaceholder(filter),
          options: []
        };

      case FilterKind.Boolean:
        return {
          key: filter.key,
          label: this.toDisplayLabel(filter, 'Access'),
          kind: filter.kind,
          controlType: 'select',
          emptyOptionLabel: 'Any access',
          options: [
            {
              value: 'true',
              label: filter.label || 'Free only'
            }
          ]
        };

      case FilterKind.Facet:
      default:
        return {
          key: filter.key,
          label: this.toDisplayLabel(filter, 'Filter'),
          kind: filter.kind,
          controlType: 'select',
          emptyOptionLabel: this.toFacetPlaceholder(filter),
          options: filter.values
        };
    }
  }

  private toDisplayLabel(filter: SearchSchemaFilter, fallback: string): string {
    if (filter.label?.trim()) {
      return filter.label.trim();
    }

    const resourceField = filter.resourceField?.trim();
    if (resourceField) {
      return resourceField;
    }

    return fallback;
  }

  private toFacetPlaceholder(filter: SearchSchemaFilter): string {
    const label = this.toDisplayLabel(filter, 'Filter').toLowerCase();
    return `Any ${label}`;
  }

  private toTextPlaceholder(filter: SearchSchemaFilter): string {
    const label = this.toDisplayLabel(filter, 'filter').toLowerCase();
    return `Search ${label}...`;
  }

  private normalizeIdentifier(value: string | null | undefined): string {
    return String(value ?? '')
      .replace(/[\s_-]+/g, '')
      .toLowerCase();
  }
}
