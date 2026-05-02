import { FacetModel } from '../models/facet';

const MONETIZATION_IDENTIFIERS = new Set([
  'monetization',
  'pricing',
  'price',
  'cost',
  'access',
  'businessmodel',
  'business-model',
  'paymentmodel',
  'payment-model',
]);

const FREE_MONETIZATION_VALUES = new Set(['free', 'open-source', 'opensource']);
const PAID_MONETIZATION_VALUES = new Set([
  'freemium',
  'free-trial',
  'freetrial',
  'subscription',
  'one-time-purchase',
  'onetimepurchase',
  'unknown',
]);

/**
 * Returns true when a schema/facet identifier represents the monetization model.
 */
export function isMonetizationKey(value: string | null | undefined): boolean {
  const normalized = normalizeIdentifier(value);
  return MONETIZATION_IDENTIFIERS.has(normalized);
}

/**
 * Gets the first monetization facet from a resource facet list.
 */
export function getMonetizationFacet(facets: FacetModel[] | null | undefined): FacetModel | null {
  return facets?.find((facet) => isMonetizationKey(facet.key)) ?? null;
}

/**
 * Gets a human-friendly monetization label, falling back to the legacy free flag.
 */
export function getMonetizationLabel(
  facets: FacetModel[] | null | undefined,
  fallbackIsFree: boolean | null | undefined
): string {
  const facet = getMonetizationFacet(facets);
  const label = facet?.label?.trim() || humanizeMonetizationValue(facet?.value);

  if (label) {
    return label;
  }

  return fallbackIsFree ? 'Free' : 'Unknown';
}

/**
 * Derives the old isFree field from a chosen monetization facet value.
 */
export function deriveIsFreeFromMonetization(value: string | null | undefined): boolean | null {
  const normalized = normalizeIdentifier(value);
  if (!normalized) {
    return null;
  }

  if (FREE_MONETIZATION_VALUES.has(normalized)) {
    return true;
  }

  if (PAID_MONETIZATION_VALUES.has(normalized)) {
    return false;
  }

  return null;
}

/**
 * Derives the old isFree field from a filterValues payload.
 */
export function deriveIsFreeFromFilterValues(filterValues: Record<string, string[]>): boolean | null {
  const monetizationEntry = Object.entries(filterValues).find(([key]) => isMonetizationKey(key));
  return deriveIsFreeFromMonetization(monetizationEntry?.[1]?.[0]);
}

/**
 * Returns whether a monetization label should use the positive/free visual tone.
 */
export function isFreeMonetizationValue(value: string | null | undefined): boolean {
  return deriveIsFreeFromMonetization(value) === true;
}

function normalizeIdentifier(value: string | null | undefined): string {
  return String(value ?? '')
    .replace(/[\s_-]+/g, '')
    .toLowerCase();
}

function humanizeMonetizationValue(value: string | null | undefined): string | null {
  const trimmed = value?.trim();
  if (!trimmed) {
    return null;
  }

  return trimmed
    .replace(/[-_]+/g, ' ')
    .replace(/\b\w/g, (character) => character.toUpperCase());
}
