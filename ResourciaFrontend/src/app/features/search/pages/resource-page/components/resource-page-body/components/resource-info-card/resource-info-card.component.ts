import { Component, Input, OnInit, inject } from '@angular/core';
import { SearchService } from '../../../../../../../../core/services/search.service';
import { FilterKind } from '../../../../../../../../shared/models/filter-kind';
import { ResourceDetailModel } from '../../../../../../../../shared/models/resource-detail';
import { Filter as SearchSchemaFilter } from '../../../../../../../../shared/models/search-schema';

type ResourceInfoTone = 'default' | 'blue' | 'green' | 'amber' | 'muted';

interface ResourceInfoRow {
  label: string;
  value: string;
  href?: string;
  tone?: ResourceInfoTone;
  pill?: boolean;
}

interface ResourceInfoDisplayValue {
  value: string;
  href?: string;
  tone?: ResourceInfoTone;
  pill?: boolean;
}

@Component({
  selector: 'app-resource-info-card',
  imports: [],
  templateUrl: './resource-info-card.component.html',
  styleUrl: './resource-info-card.component.scss',
})
export class ResourceInfoCardComponent implements OnInit {
  private readonly searchService = inject(SearchService);

  private schemaFilters: SearchSchemaFilter[] = [];

  @Input() resource: ResourceDetailModel | null = null;

  ngOnInit(): void {
    this.searchService.schema().subscribe({
      next: (schema) => {
        this.schemaFilters = schema.filters ?? [];
      },
      error: () => {
        this.schemaFilters = [];
      },
    });
  }

  get rows(): ResourceInfoRow[] {
    if (!this.resource) {
      return [];
    }

    return [
      ...this.getPrimaryRows(),
      ...this.getSchemaRows(),
      ...this.getMetadataRows(),
    ];
  }

  getRowValueClass(row: ResourceInfoRow): string {
    const tone = row.tone ?? 'default';

    if (row.pill) {
      const toneClasses = {
        default: 'bg-gray-100 text-gray-700',
        blue: 'bg-blue-50 text-blue-600',
        green: 'bg-green-50 text-green-600',
        amber: 'bg-amber-50 text-amber-600',
        muted: 'bg-gray-100 text-gray-500',
      };

      return `inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${toneClasses[tone]}`;
    }

    const textClasses = {
      default: 'text-sm font-medium text-gray-900 text-right',
      blue: 'text-sm font-medium text-blue-600 text-right',
      green: 'text-sm font-semibold text-green-600 text-right',
      amber: 'text-sm font-semibold text-amber-600 text-right',
      muted: 'text-sm font-medium text-gray-400 text-right',
    };

    return textClasses[tone];
  }

  private getPrimaryRows(): ResourceInfoRow[] {
    const type = this.getFacetValue(['type', 'resourceType', 'resource-type', 'format']);
    const domain = this.getDomain(this.resource?.url);
    const language = this.getFacetValue(['language', 'lang']);
    const difficulty = this.getFacetValue(['difficulty', 'level']);

    return [
      this.createRow('Type', type, 'Not specified', 'blue', true),
      domain
        ? { label: 'Domain', value: domain, href: this.resource?.url ?? undefined, tone: 'blue' }
        : this.createRow('Domain', null, 'Unavailable'),
      this.createRow('Language', language),
      this.createRow('Difficulty', difficulty, 'Not specified', 'amber'),
      {
        label: 'Cost',
        value: this.resource?.isFree ? 'Free' : 'Paid',
        tone: this.resource?.isFree ? 'green' : 'default',
        pill: !!this.resource?.isFree,
      },
    ];
  }

  private getSchemaRows(): ResourceInfoRow[] {
    return this.schemaFilters
      .filter((filter) => !this.isReservedSchemaField(filter))
      .map((filter) => this.resolveSchemaRow(filter))
      .filter((row): row is ResourceInfoRow => row !== null);
  }

  private getMetadataRows(): ResourceInfoRow[] {
    const createdBy = this.resource?.createdBy?.trim();
    const savesCount = this.formatSavesCount(this.resource?.savesCount);
    const added = this.formatDate(this.resource?.createdAtUtc);
    const updated = this.formatDate(this.resource?.updatedAtUtc);

    return [
      this.createRow('Added By', createdBy, 'Resourcia', 'blue'),
      this.createRow('Saves', savesCount, '0 saves'),
      this.createRow('Added', added, 'Unknown'),
      this.createRow('Updated', updated, 'Unknown'),
    ];
  }

  private resolveSchemaRow(filter: SearchSchemaFilter): ResourceInfoRow | null {
    const label = filter.label?.trim();
    if (!label) {
      return null;
    }

    const value = filter.resourceField
      ? this.resolveResourceFieldValue(filter.resourceField, filter.kind)
      : this.resolveFacetFilterValue(filter);

    if (!value) {
      return this.createRow(label, null);
    }

    return {
      label,
      value: value.value,
      href: value.href,
      tone: value.tone,
      pill: value.pill,
    };
  }

  private resolveFacetFilterValue(filter: SearchSchemaFilter): ResourceInfoDisplayValue | null {
    const value = this.getFacetValue([filter.key], filter.values);
    return value ? { value } : null;
  }

  private resolveResourceFieldValue(resourceField: string, kind: FilterKind): ResourceInfoDisplayValue | null {
    const rawValue = this.getResourceFieldRawValue(resourceField);
    if (rawValue === null || rawValue === undefined) {
      return null;
    }

    switch (resourceField.toLowerCase()) {
      case 'createdatutc':
      case 'updatedatutc': {
        const formatted = this.formatDate(this.asString(rawValue));
        return formatted ? { value: formatted } : null;
      }
      case 'savescount': {
        const formatted = this.formatSavesCount(rawValue);
        return formatted ? { value: formatted } : null;
      }
      case 'url': {
        const url = this.asString(rawValue);
        if (!url) {
          return null;
        }

        return {
          value: this.getDomain(url) ?? url,
          href: url,
          tone: 'blue',
        };
      }
      default:
        return this.formatGenericValue(rawValue, kind);
    }
  }

  private formatGenericValue(rawValue: unknown, kind: FilterKind): ResourceInfoDisplayValue | null {
    if (Array.isArray(rawValue)) {
      const joined = rawValue
        .map((value) => this.asString(value))
        .filter((value): value is string => !!value)
        .join(', ');

      return joined ? { value: joined } : null;
    }

    if (typeof rawValue === 'boolean') {
      if (kind === FilterKind.Boolean) {
        return { value: rawValue ? 'Yes' : 'No' };
      }

      return { value: rawValue ? 'True' : 'False' };
    }

    if (typeof rawValue === 'number' && Number.isFinite(rawValue)) {
      return { value: String(rawValue) };
    }

    const value = this.asString(rawValue);
    return value ? { value } : null;
  }

  private getResourceFieldRawValue(resourceField: string): unknown {
    if (!this.resource) {
      return null;
    }

    const resourceRecord = this.resource as unknown as Record<string, unknown>;
    const exactMatch = resourceRecord[resourceField];
    if (exactMatch !== undefined) {
      return exactMatch;
    }

    const camelCaseField = resourceField.charAt(0).toLowerCase() + resourceField.slice(1);
    const camelCaseMatch = resourceRecord[camelCaseField];
    if (camelCaseMatch !== undefined) {
      return camelCaseMatch;
    }

    const caseInsensitiveKey = Object.keys(resourceRecord).find(
      (key) => key.toLowerCase() === resourceField.toLowerCase()
    );

    return caseInsensitiveKey ? resourceRecord[caseInsensitiveKey] : null;
  }

  private isReservedSchemaField(filter: SearchSchemaFilter): boolean {
    const reservedFacetKeys = new Set([
      'type',
      'resourcetype',
      'resource-type',
      'format',
      'language',
      'lang',
      'difficulty',
      'level',
      'domain',
    ]);

    const reservedResourceFields = new Set([
      'url',
      'isfree',
      'createdby',
      'createdatutc',
      'updatedatutc',
      'savescount',
    ]);

    return reservedFacetKeys.has(filter.key.toLowerCase())
      || reservedResourceFields.has(filter.resourceField?.toLowerCase() ?? '');
  }

  private getFacetValue(
    keys: string[],
    filterValues: { value: string; label: string }[] = [],
  ): string | null {
    const normalizedKeys = keys.map((key) => key.toLowerCase());
    const optionLabels = new Map(
      filterValues.map((value) => [value.value.toLowerCase(), value.label?.trim() ?? ''])
    );
    const matches = this.resource?.facets.filter((facet) =>
      normalizedKeys.includes(facet.key.toLowerCase())
    ) ?? [];

    if (matches.length === 0) {
      return null;
    }

    const values = matches
      .map((facet) =>
        facet.label?.trim()
        || optionLabels.get(facet.value.toLowerCase())
        || this.humanizeFacetValue(facet.value)
      )
      .filter((value): value is string => !!value);

    return [...new Set(values)].join(', ') || null;
  }

  private getDomain(url: string | null | undefined): string | null {
    if (!url?.trim()) {
      return null;
    }

    try {
      return new URL(url).hostname.replace(/^www\./, '');
    } catch {
      try {
        return new URL(`https://${url}`).hostname.replace(/^www\./, '');
      } catch {
        return null;
      }
    }
  }

  private formatDate(value: string | null | undefined): string | null {
    if (!value) {
      return null;
    }

    const parsed = new Date(value);
    if (Number.isNaN(parsed.getTime())) {
      return null;
    }

    return new Intl.DateTimeFormat(undefined, {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    }).format(parsed);
  }

  private formatSavesCount(value: unknown): string | null {
    if (typeof value !== 'number' || !Number.isFinite(value)) {
      return null;
    }

    return `${value} ${value === 1 ? 'save' : 'saves'}`;
  }

  private asString(value: unknown): string | null {
    if (typeof value !== 'string') {
      return null;
    }

    const trimmed = value.trim();
    return trimmed || null;
  }

  private createRow(
    label: string,
    value: string | null | undefined,
    fallback = 'Not specified',
    accentTone: Exclude<ResourceInfoTone, 'green' | 'muted'> = 'default',
    pill = false,
  ): ResourceInfoRow {
    if (value) {
      return {
        label,
        value,
        tone: accentTone,
        pill,
      };
    }

    return {
      label,
      value: fallback,
      tone: 'muted',
      pill: false,
    };
  }

  private humanizeFacetValue(value: string | null | undefined): string {
    return value
      ?.replace(/[-_]+/g, ' ')
      .replace(/\b\w/g, (character) => character.toUpperCase())
      .trim() ?? '';
  }
}
