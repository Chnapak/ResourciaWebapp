import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { SearchService } from '../../../../../../core/services/search.service';
import { Filter as SearchSchemaFilter, FilterValue } from '../../../../../../shared/models/search-schema';
import { FilterKind } from '../../../../../../shared/models/filter-kind';
import { isMonetizationKey } from '../../../../../../shared/utils/monetization.utils';

/**
 * Supported UI controls for home page filters.
 */
type HomeFilterControlType = 'select' | 'text';

/**
 * Normalized filter representation used by the home page search form.
 */
interface HomeSearchFilter {
  /** Query string key. */
  key: string;
  /** Human-friendly label used in the UI. */
  label: string;
  /** Original filter kind from the schema. */
  kind: FilterKind;
  /** Which input widget to render. */
  controlType: HomeFilterControlType;
  /** Placeholder for the "no selection" option. */
  emptyOptionLabel?: string;
  /** Placeholder text for text inputs. */
  placeholder?: string;
  /** Selectable options for facet/boolean filters. */
  options: FilterValue[];
}

/**
 * Compact search form shown in the hero banner on the public home page.
 */
@Component({
  selector: 'app-resource-search',
  imports: [CommonModule, FormsModule],
  templateUrl: './resource-search.component.html',
  styleUrl: './resource-search.component.scss'
})
export class ResourceSearchComponent implements OnInit {
  /** Max number of filters to surface in the hero search form. */
  readonly homeFilterLimit = 3;

  /** Filters chosen for the home page widget. */
  filters: HomeSearchFilter[] = [];
  /** Current form values keyed by filter key. */
  formValues: Record<string, string> = {};
  /** Toggles the loading state while the search schema is fetched. */
  isSchemaLoading = true;

  /** Inject router navigation and schema fetching services. */
  constructor(
    private router: Router,
    private searchService: SearchService
  ) {}

  /** Load the schema and build the home-page filters. */
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

  /** Navigate to the full search page with the filled-in query params. */
  onSearch(): void {
    const queryParams: Record<string, string> = {};

    for (const filter of this.filters) {
      const rawValue = this.formValues[filter.key] ?? '';
      const value = rawValue.trim();

      if (!value) {
        continue;
      }

      if (filter.kind === FilterKind.Boolean) {
        if (value === 'true' || value === 'false') {
          queryParams[filter.key] = value;
        }

        continue;
      }

      queryParams[filter.key] = value;
    }

    this.router.navigate(['/search'], { queryParams });
  }

  /**
   * Pick the best filters for the hero form based on preferred kinds/keys.
   */
  private pickHomeFilters(filters: SearchSchemaFilter[]): HomeSearchFilter[] {
    const available = filters.filter((filter) => this.isEligibleHomeFilter(filter));
    const selected: SearchSchemaFilter[] = [];

    this.addPreferredFilter(selected, available, (filter) =>
      filter.kind === FilterKind.Facet && this.matchesFilter(filter, ['subject']));

    this.addPreferredFilter(selected, available, (filter) =>
      this.isUsesAiFilter(filter) && (filter.kind === FilterKind.Boolean || filter.kind === FilterKind.Facet));

    this.addPreferredFilter(selected, available, (filter) =>
      filter.kind === FilterKind.Facet && this.isMonetizationFilter(filter));

    this.addPreferredFilter(selected, available, (filter) =>
      filter.kind === FilterKind.Boolean && this.matchesFilter(filter, ['isfree']));

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

  /**
   * Add a preferred filter if a match exists and we still have room.
   */
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

  /**
   * Determine whether a schema filter can be shown in the hero widget.
   */
  private isEligibleHomeFilter(filter: SearchSchemaFilter): boolean {
    if (this.isAuthorFilter(filter)) {
      return false;
    }

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

  /**
   * Match filters by key, label, or resource field name, normalized for comparison.
   */
  private matchesFilter(filter: SearchSchemaFilter, identifiers: string[]): boolean {
    const normalizedKey = this.normalizeIdentifier(filter.key);
    const normalizedLabel = this.normalizeIdentifier(filter.label);
    const normalizedField = this.normalizeIdentifier(filter.resourceField);

    return identifiers.some((identifier) => {
      const normalizedIdentifier = this.normalizeIdentifier(identifier);
      return normalizedIdentifier === normalizedKey
        || normalizedIdentifier === normalizedLabel
        || normalizedIdentifier === normalizedField;
    });
  }

  /**
   * Detects the "uses AI" filter even if the backend/admin naming varies slightly.
   */
  private isUsesAiFilter(filter: SearchSchemaFilter): boolean {
    return this.matchesFilter(filter, [
      'usesAi',
      'uses-ai',
      'uses_ai',
      'uses AI',
      'hasAi',
      'has AI',
      'ai',
      'ai assisted',
      'ai generated',
      'contains AI'
    ]);
  }

  /**
   * Detects pricing/monetization filters even if the admin labels them differently.
   */
  private isMonetizationFilter(filter: SearchSchemaFilter): boolean {
    return isMonetizationKey(filter.key)
      || isMonetizationKey(filter.label)
      || isMonetizationKey(filter.resourceField);
  }

  /**
   * The home hero intentionally shows "Uses AI" in place of author.
   */
  private isAuthorFilter(filter: SearchSchemaFilter): boolean {
    return this.matchesFilter(filter, ['author']);
  }

  /**
   * Convert a schema filter into the UI model used by this component.
   */
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
          label: this.toDisplayLabel(filter, this.isUsesAiFilter(filter) ? 'Uses AI' : 'Access'),
          kind: filter.kind,
          controlType: 'select',
          emptyOptionLabel: this.toBooleanPlaceholder(filter),
          options: [
            {
              value: 'true',
              label: this.toBooleanOptionLabel(filter, true)
            },
            {
              value: 'false',
              label: this.toBooleanOptionLabel(filter, false)
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

  /**
   * Select a display label for a filter, falling back to a default.
   */
  private toDisplayLabel(filter: SearchSchemaFilter, fallback: string): string {
    if (filter.label?.trim()) {
      return filter.label.trim();
    }

    const resourceField = filter.resourceField?.trim();
    if (resourceField) {
      return this.humanizeIdentifier(resourceField);
    }

    const key = filter.key?.trim();
    if (key) {
      return this.humanizeIdentifier(key);
    }

    return fallback;
  }

  /**
   * Placeholder text for facet filters (select inputs).
   */
  private toFacetPlaceholder(filter: SearchSchemaFilter): string {
    if (this.isMonetizationFilter(filter)) {
      return 'Any pricing';
    }

    const label = this.toDisplayLabel(filter, 'Filter').toLowerCase();
    return `Any ${label}`;
  }

  /**
   * Placeholder text for boolean filters.
   */
  private toBooleanPlaceholder(filter: SearchSchemaFilter): string {
    if (this.isUsesAiFilter(filter)) {
      return 'Any AI usage';
    }

    if (this.matchesFilter(filter, ['isfree'])) {
      return 'Any access';
    }

    const label = this.toDisplayLabel(filter, 'option').toLowerCase();
    return `Any ${label}`;
  }

  /**
   * Select label for a specific boolean value.
   */
  private toBooleanOptionLabel(filter: SearchSchemaFilter, value: boolean): string {
    if (this.isUsesAiFilter(filter)) {
      return value ? 'Uses AI' : 'Does not use AI';
    }

    if (this.matchesFilter(filter, ['isfree'])) {
      return value ? (filter.label?.trim() || 'Free only') : 'Paid only';
    }

    const label = this.toDisplayLabel(filter, 'Option');
    return `${label}: ${value ? 'Yes' : 'No'}`;
  }

  /**
   * Placeholder text for text filters.
   */
  private toTextPlaceholder(filter: SearchSchemaFilter): string {
    const label = this.toDisplayLabel(filter, 'filter').toLowerCase();
    return `Search ${label}...`;
  }

  /**
   * Normalize identifiers to improve matching between keys and fields.
   */
  private normalizeIdentifier(value: string | null | undefined): string {
    return String(value ?? '')
      .replace(/[\s_-]+/g, '')
      .toLowerCase();
  }

  /**
   * Converts schema identifiers such as "usesAi" into readable labels.
   */
  private humanizeIdentifier(value: string): string {
    return value
      .replace(/([a-z0-9])([A-Z])/g, '$1 $2')
      .replace(/[\s_-]+/g, ' ')
      .trim()
      .replace(/\b\w/g, (character) => character.toUpperCase())
      .replace(/\bAi\b/g, 'AI');
  }
}
