/**
 * Payload models used when updating existing admin filters.
 */

/**
 * Represents a facet value update within a filter.
 */
export interface AdminFacetValueUpdateModel {
  /** Optional id of an existing facet value. */
  id?: string;
  /** New label shown in the UI. */
  label: string;
}

/**
 * Represents the editable fields for a filter update.
 */
export interface AdminFilterUpdateModel {
  /** Updated display label for the filter. */
  label: string;
  /** Updated optional help text for the filter. */
  description: string | null;
  /** Updated set of facet values. */
  facetValues: AdminFacetValueUpdateModel[];
}
