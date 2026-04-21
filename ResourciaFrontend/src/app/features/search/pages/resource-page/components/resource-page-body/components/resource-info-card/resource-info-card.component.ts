import { Component, Input, OnInit, inject } from '@angular/core';
import { SearchService } from '../../../../../../../../core/services/search.service';
import { FilterKind } from '../../../../../../../../shared/models/filter-kind';
import { ResourceDetailModel } from '../../../../../../../../shared/models/resource-detail';
import { Filter as SearchSchemaFilter } from '../../../../../../../../shared/models/search-schema';
import { RouterLink } from '@angular/router';

/**
 * Tone variants for info row styling.
 */
type ResourceInfoTone = 'default' | 'blue' | 'green' | 'amber' | 'muted';

/**
 * Rendered row in the info card.
 */
interface ResourceInfoRow {
  /** Row label (left column). */
  label: string;
  /** Row value (right column). */
  value: string;
  /** Optional external link. */
  href?: string;
  /** Optional router link for internal navigation. */
  routerLink?: string[];
  /** Visual tone used for value styling. */
  tone?: ResourceInfoTone;
  /** Whether the value should render as a pill. */
  pill?: boolean;
}

/**
 * Display value resolved from resource data.
 */
interface ResourceInfoDisplayValue {
  /** Display string. */
  value: string;
  /** Optional external link. */
  href?: string;
  /** Visual tone for styling. */
  tone?: ResourceInfoTone;
  /** Whether the value should render as a pill. */
  pill?: boolean;
}

/**
 * Card with resource metadata and schema-derived fields.
 */
@Component({
  selector: 'app-resource-info-card',
  imports: [RouterLink],
  templateUrl: './resource-info-card.component.html',
  styleUrl: './resource-info-card.component.scss',
})
export class ResourceInfoCardComponent implements OnInit {
  /** Search service used to load schema labels/metadata. */
  private readonly searchService = inject(SearchService);

  /** Cached schema filters for label lookups. */
  private schemaFilters: SearchSchemaFilter[] = [];

  /** Resource details shown in this card. */
  @Input() resource: ResourceDetailModel | null = null;
  /** Optional link to the resource history page. */
  @Input() historyLink: string[] | null = null;

  /** Load schema metadata on init. */
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

  /** Aggregated rows displayed in the card. */
  get rows(): ResourceInfoRow[] {
    if (!this.resource) {
      return [];
    }

    return [
      ...this.getPrimaryRows(),
      ...this.getSchemaRows(),
      ...this.getHistoryRows(),
      ...this.getMetadataRows(),
    ];
  }

  /** Build CSS classes for a row value based on tone and pill style. */
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

  /** Primary rows (type, domain, language, etc.). */
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

  /** Rows derived from non-reserved schema filters. */
  private getSchemaRows(): ResourceInfoRow[] {
    return this.schemaFilters
      .filter((filter) => !this.isReservedSchemaField(filter))
      .map((filter) => this.resolveSchemaRow(filter))
      .filter((row): row is ResourceInfoRow => row !== null);
  }

  /** Metadata rows for created/updated/saves/etc. */
  private getMetadataRows(): ResourceInfoRow[] {
    const createdBy = this.resource?.createdBy?.trim();
    const savesCount = this.formatSavesCount(this.resource?.savesCount);
    const added = this.formatDate(this.resource?.createdAtUtc);
    const updated = this.formatDate(this.resource?.updatedAtUtc);

    return [
      createdBy
        ? { label: 'Added By', value: createdBy, tone: 'blue', routerLink: ['/profile', createdBy] }
        : this.createRow('Added By', null, 'Resourcia', 'blue'),
      this.createRow('Saves', savesCount, '0 saves'),
      this.createRow('Added', added, 'Unknown'),
      this.createRow('Updated', updated, 'Unknown'),
    ];
  }

  /** Optional rows that link to resource history. */
  private getHistoryRows(): ResourceInfoRow[] {
    if (!this.historyLink) {
      return [];
    }

    return [
      {
        label: 'History',
        value: 'View changes',
        tone: 'blue',
        routerLink: this.historyLink,
      }
    ];
  }

  /** Resolve a single schema filter into a display row. */
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

  /** Resolve a facet filter to a display value. */
  private resolveFacetFilterValue(filter: SearchSchemaFilter): ResourceInfoDisplayValue | null {
    const value = this.getFacetValue([filter.key], filter.values);
    return value ? { value } : null;
  }

  /** Resolve a resource field (non-facet) to a display value. */
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

  /** Format values for generic display based on their type. */
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

  /** Fetch a raw value from the resource by field name. */
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

  /** Whether a schema filter is already represented in primary rows. */
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

  /** Resolve facet values by key with optional label mapping. */
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

  /** Extract a clean domain from a URL. */
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

  /** Format ISO dates into a readable short date. */
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

  /** Format saved count with pluralization. */
  private formatSavesCount(value: unknown): string | null {
    if (typeof value !== 'number' || !Number.isFinite(value)) {
      return null;
    }

    return `${value} ${value === 1 ? 'save' : 'saves'}`;
  }

  /** Convert a value to a trimmed string. */
  private asString(value: unknown): string | null {
    if (typeof value !== 'string') {
      return null;
    }

    const trimmed = value.trim();
    return trimmed || null;
  }

  /** Build a row with fallback text and tone. */
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

  /** Humanize facet values by converting to title case. */
  private humanizeFacetValue(value: string | null | undefined): string {
    return value
      ?.replace(/[-_]+/g, ' ')
      .replace(/\b\w/g, (character) => character.toUpperCase())
      .trim() ?? '';
  }
}
