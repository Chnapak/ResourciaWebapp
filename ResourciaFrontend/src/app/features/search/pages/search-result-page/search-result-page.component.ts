import { Component, inject, OnInit, signal } from '@angular/core';
import { SchemaResponse } from '../../../../shared/models/search-schema';
import { FilterKind } from '../../../../shared/models/filter-kind';
import { SearchService } from '../../../../core/services/search.service';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { ExploreToolbarComponent } from './components/explore-toolbar/explore-toolbar.component';
import { RadioComponent } from '../../../../shared/ui/radio/radio.component';
import { RadioFacetComponent } from '../../components/facets/radio-facet/radio-facet.component';
import { CheckboxFacetComponent } from '../../components/facets/checkbox-facet/checkbox-facet.component';
import { SearchableSelectComponent, SelectOption } from '../../../../shared/ui/searchable-select/searchable-select.component';
import { SearchableSingleFacetComponent } from '../../components/facets/searchable-single-facet/searchable-single-facet.component';
import { ToasterService } from '../../../../shared/toaster/toaster.service';
import { SearchableMultiSelectComponent } from '../../../../shared/ui/searchable-multi-select/searchable-multi-select.component';
import { FiltersSectionComponent } from './components/filters-section/filters-section.component';
import { FiltersSidebarComponent } from './components/filters-sidebar/filters-sidebar.component';
import { ResourceCardComponent } from './components/resource-card/resource-card.component';
import { ResourceService } from '../../../../core/services/resource.service';
import { ButtonComponent } from '../../../../shared/ui/button/button.component';
import { PaginationComponent } from '../../../../shared/ui/pagination/pagination.component';
import { FacetModel } from '../../../../shared/models/facet';
import { ActiveChip } from '../../../../shared/models/active-chip';
import { SearchResultResourceModel } from '../../../../shared/models/search-result-resource';


@Component({
  selector: 'app-search-result-page',
  standalone: true,
  imports: [ RouterLink, ExploreToolbarComponent, RadioFacetComponent, CheckboxFacetComponent, SearchableSingleFacetComponent , SearchableMultiSelectComponent, FiltersSidebarComponent, ResourceCardComponent, ButtonComponent, PaginationComponent ],
  templateUrl: './search-result-page.component.html',
  styleUrl: './search-result-page.component.scss'
})
export class SearchResultPageComponent implements OnInit {
  schema: SchemaResponse | null = null;
  FilterKind = FilterKind;

  collapsed = signal<Record<string, boolean>>({});

  private toaster = inject(ToasterService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);

  resources: SearchResultResourceModel[] = [];
  currentPage = 1;
  itemsPerPage = 27;
  totalItems = 0;
  totalPages = 0;

  queryState: {
    facets: Record<string, string | string[]>;
    ranges: Record<string, { min?: string; max?: string }>;
    booleans: Record<string, boolean>;
    texts: Record<string, string>;
  } = {
    facets: {},
    ranges: {},
    booleans: {},
    texts: {}
  };

  areFiltersHidden: boolean = false;

  constructor(private search: SearchService, private resource: ResourceService) {}

  ngOnInit(): void {
    
    this.search.schema().subscribe((data: SchemaResponse) => {
      this.schema = data;

      const initial: Record<string, boolean> = {};
      for (const f of data.filters) initial[f.key] = true;
      this.collapsed.set(initial);

      this.route.queryParamMap.subscribe(params => {
        this.hydrateStateFromQueryParams(data, params);
        this.loadResources();
      });
    });
  }



  toggleSection(key: string) {
    this.collapsed.update(m => ({ ...m, [key]: !m[key] }));
  }

  isCollapsed(key: string) {
    return this.collapsed()[key] ?? true;
  }

  clearAllFilters(): void {
    this.queryState = {
      facets: {},
      ranges: {},
      booleans: {},
      texts: {}
    };

    console.log('clear all filters');
    console.log('query', this.buildQuery());

    this.updateUrl();

    this.toaster.show('All filters cleared', 'success');
  }

  onFacetChange(filter: any, value: string | string[] | null): void {    
    if (!this.queryState.facets) {
      this.queryState.facets = {};
    }

    const isEmptyArray = Array.isArray(value) && value.length === 0;
    const isEmptyString = value === '';

    if (value == null || isEmptyArray || isEmptyString) {
      delete this.queryState.facets[filter.key];
    } else {
      this.queryState.facets[filter.key] = value;
    }

    this.updateUrl();

    console.log('facet change', filter, value);
    console.log('query', this.buildQuery());
  }

  onNumberRangeChange(filter: any, type: 'min' | 'max', value: string): void {
    if (!this.queryState.ranges[filter.key]) {
      this.queryState.ranges[filter.key] = {};
    }

    if (!value) {
      delete this.queryState.ranges[filter.key][type];
    } else {
      this.queryState.ranges[filter.key][type] = value;
    }

    const range = this.queryState.ranges[filter.key];
    if (!range.min && !range.max) {
      delete this.queryState.ranges[filter.key];
    }

    console.log('range change', filter, type, value);
    console.log('query', this.buildQuery());
  }

  onBoolChange(filter: any, value: boolean): void {
    this.queryState.booleans[filter.key] = value;

    console.log('boolean change', filter, value);
    console.log('query', this.buildQuery());
  }

  onTextChange(filter: any, value: string): void {
    const trimmedValue = value.trim();

    if (!trimmedValue) {
      delete this.queryState.texts[filter.key];
    } else {
      this.queryState.texts[filter.key] = trimmedValue;
    }

    console.log('text change', filter, value);
    console.log('query', this.buildQuery());
  }


  buildQuery() {
    const query: Record<string, any> = {};

    for (const key in this.queryState.facets) {
      query[key] = this.queryState.facets[key];
    }

    for (const key in this.queryState.ranges) {
      const range = this.queryState.ranges[key];

      if (range.min) {
        query[`${key}Min`] = range.min;
      }

      if (range.max) {
        query[`${key}Max`] = range.max;
      }
    }

    for (const key in this.queryState.booleans) {
      query[key] = this.queryState.booleans[key];
    }

    for (const key in this.queryState.texts) {
      query[key] = this.queryState.texts[key];
    }

    return query;
  }

  private hydrateStateFromQueryParams(schema: SchemaResponse, params: import('@angular/router').ParamMap): void {

    this.currentPage = Math.max(1, Number(params.get('p') ?? 1) || 1);

    this.queryState = {
      facets: {},
      ranges: {},
      booleans: {},
      texts: {}
    };

    for (const filter of schema.filters) {
      const key = filter.key;

      switch (filter.kind) {
        case FilterKind.Facet: {
          const raw = params.get(key);

          if (typeof raw === 'string' && raw.trim()) {
            if (raw.includes(',')) {
              this.queryState.facets[key] = raw.split(',').filter(Boolean);
            } else {
              this.queryState.facets[key] = raw;
            }
          }

          break;
        }

        case FilterKind.Range: {
          const min = params.get(`${key}Min`);
          const max = params.get(`${key}Max`);

          if (
            (typeof min === 'string' && min.trim()) ||
            (typeof max === 'string' && max.trim())
          ) {
            this.queryState.ranges[key] = {};

            if (typeof min === 'string' && min.trim()) {
              this.queryState.ranges[key].min = min;
            }

            if (typeof max === 'string' && max.trim()) {
              this.queryState.ranges[key].max = max;
            }
          }

          break;
        }

        case FilterKind.Boolean: {
          const raw = params.get(key)

          if (raw === 'true') {
            this.queryState.booleans[key] = true;
          } else if (raw === 'false') {
            this.queryState.booleans[key] = false;
          }

          break;
        }

        case FilterKind.Text: {
          const raw = params.get(key);

          if (typeof raw === 'string' && raw.trim()) {
            this.queryState.texts[key] = raw;
          }

          break;
        }
      }
    }
  }

  private loadResources(): void {
    const query = this.buildQuery();

    query['page'] = this.currentPage;
    query['pageSize'] = this.itemsPerPage;

    this.resource.searchResource(query).subscribe({
      next: results => {
        this.resources = results.items;
        this.totalPages = results.totalPages;
        this.currentPage = results.page;
        this.totalItems = results.totalItems;

        console.log('Resources:', results);
      },
      error: err => {
        console.error('Failed to load resources', err);
        this.toaster.show('Failed to load resources', 'error');
      }
    });
  }

  updateUrl(page?: number): void {
    const query: Record<string, any> = {};

    for (const key in this.queryState.facets) {
      const value = this.queryState.facets[key];
      query[key] = Array.isArray(value) ? value.join(',') : value;
    }

    for (const key in this.queryState.ranges) {
      const range = this.queryState.ranges[key];
      if (range.min) query[`${key}Min`] = range.min;
      if (range.max) query[`${key}Max`] = range.max;
    }

    for (const key in this.queryState.booleans) {
      query[key] = this.queryState.booleans[key];
    }

    for (const key in this.queryState.texts) {
      query[key] = this.queryState.texts[key];
    }

    const nextPage = page ?? this.currentPage;

    if (nextPage > 1) {
      query['p'] = nextPage;
    }

    this.router.navigate([], {
      relativeTo: this.route,
      queryParams: query,
      queryParamsHandling: ''
    });

    this.loadResources();
  }

  openResource(resource: SearchResultResourceModel): void {
    window.open(resource.url, '_blank');
  }

  async shareResource(resource: SearchResultResourceModel): Promise<void> {
    const shareUrl = this.getShareUrl(resource);
    if (!shareUrl) {
      this.toaster.show('Resource link is not available yet.', 'error');
      return;
    }

    const copied = await this.copyToClipboard(shareUrl);
    if (copied) {
      this.toaster.show('Resource link copied to clipboard.', 'success');
      return;
    }

    this.toaster.show('Could not copy the resource link.', 'error');
  }

  hideFilters(): void {
    this.areFiltersHidden = this.areFiltersHidden ? false : true
  }

  onPageChange(page: number): void {
    if (page < 1 || page > this.totalPages || page === this.currentPage) return;

    this.router.navigate([], {
      relativeTo: this.route,
      queryParams: { ...this.serializeFiltersToQuery(), p: page },
      replaceUrl: false
    });
  }

  private serializeFiltersToQuery(): Record<string, any> {
    const query: Record<string, any> = {};

    for (const key in this.queryState.facets) {
      const value = this.queryState.facets[key];
      query[key] = Array.isArray(value) ? value.join(',') : value;
    }

    for (const key in this.queryState.ranges) {
      const range = this.queryState.ranges[key];
      if (range.min) query[`${key}Min`] = range.min;
      if (range.max) query[`${key}Max`] = range.max;
    }

    for (const key in this.queryState.booleans) {
      query[key] = this.queryState.booleans[key];
    }

    for (const key in this.queryState.texts) {
      query[key] = this.queryState.texts[key];
    }

    return query;
  }

  private getShareUrl(resource: SearchResultResourceModel): string | null {
    if (!resource.id) {
      return null;
    }

    const relativePath = `/resource/${resource.id}`;
    const origin = globalThis.location?.origin;

    return origin ? `${origin}${relativePath}` : relativePath;
  }

  private async copyToClipboard(value: string): Promise<boolean> {
    try {
      if (globalThis.navigator?.clipboard?.writeText) {
        await globalThis.navigator.clipboard.writeText(value);
        return true;
      }
    } catch {
      // Fall back to the manual copy path below.
    }

    if (typeof document === 'undefined') {
      return false;
    }

    const textarea = document.createElement('textarea');
    textarea.value = value;
    textarea.setAttribute('readonly', 'true');
    textarea.style.position = 'fixed';
    textarea.style.opacity = '0';
    textarea.style.pointerEvents = 'none';

    document.body.appendChild(textarea);
    textarea.focus();
    textarea.select();

    try {
      return document.execCommand('copy');
    } catch {
      return false;
    } finally {
      document.body.removeChild(textarea);
    }
  }

  get activeFilterChips(): ActiveChip[] {
    if (!this.schema) return [];

    const chips: ActiveChip[] = [];

    for (const filter of this.schema.filters) {
      const key = filter.key;
      const label = filter.label ?? filter.key;

      switch (filter.kind) {
        case FilterKind.Facet: {
          const raw = this.queryState.facets[key];

          const findLabel = (val: string) => {
            const option = filter.values?.find((o: any) => o.value === val);
            return option?.label ?? val;
          };

          if (Array.isArray(raw)) {
            for (const value of raw) {
              chips.push({
                key,
                value,
                label: findLabel(value)
              });
            }
          } else if (typeof raw === 'string' && raw.trim()) {
            chips.push({
              key,
              value: raw,
              label: findLabel(raw)
            });
          }

          break;
        }

        case FilterKind.Boolean: {
          const raw = this.queryState.booleans[key];

          if (raw === true) {
            chips.push({
              key,
              value: 'true',
              label: label
            });
          }

          break;
        }

        case FilterKind.Text: {
          const raw = this.queryState.texts[key];

          if (raw?.trim()) {
            chips.push({
              key,
              value: raw,
              label: `${label}: ${raw}`
            });
          }

          break;
        }

        case FilterKind.Range: {
          const range = this.queryState.ranges[key];
          if (!range) break;

          if (range.min && range.max) {
            chips.push({
              key,
              value: `${range.min}-${range.max}`,
              label: `${label}: ${range.min}–${range.max}`
            });
          } else if (range.min) {
            chips.push({
              key,
              value: `min-${range.min}`,
              label: `${label}: ≥ ${range.min}`
            });
          } else if (range.max) {
            chips.push({
              key,
              value: `max-${range.max}`,
              label: `${label}: ≤ ${range.max}`
            });
          }

          break;
        }
      }
    }

    return chips;
  }

  removeChip(chip: ActiveChip): void {
    const filter = this.schema?.filters.find(f => f.key === chip.key);
    if (!filter) return;

    switch (filter.kind) {
      case FilterKind.Facet: {
        const current = this.queryState.facets[chip.key];

        if (Array.isArray(current)) {
          const next = current.filter(v => v !== chip.value);

          if (next.length === 0) {
            delete this.queryState.facets[chip.key];
          } else if (next.length === 1) {
            this.queryState.facets[chip.key] = next[0];
          } else {
            this.queryState.facets[chip.key] = next;
          }
        } else {
          delete this.queryState.facets[chip.key];
        }

        break;
      }

      case FilterKind.Boolean:
        delete this.queryState.booleans[chip.key];
        break;

      case FilterKind.Text:
        delete this.queryState.texts[chip.key];
        break;

      case FilterKind.Range:
        delete this.queryState.ranges[chip.key];
        break;
    }

    this.updateUrl(1);
  }
}
