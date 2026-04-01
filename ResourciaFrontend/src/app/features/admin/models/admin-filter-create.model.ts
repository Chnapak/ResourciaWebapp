/**
 * Payload models used when creating new admin filters.
 */
import { FilterKind } from "../../../shared/models/filter-kind";

/**
 * Represents a new facet value being created.
 */
export interface AdminFacetValueCreateModel {
  /** Label shown in the UI for the facet value. */
  label: string;
}

/**
 * Represents a new filter definition to create.
 */
export interface AdminFilterCreateModel {
  /** Machine-readable filter key. */
  key: string;
  /** Display label shown to end users. */
  label: string;
  /** Optional help text for the filter. */
  description: string | null;
  /** Filter behavior type (checkbox, radio, etc.). */
  kind: FilterKind;
  /** Whether the filter allows multiple selections. */
  isMulti: boolean;
  /** Whether the filter should be active immediately. */
  isActive: boolean;
  /** Optional resource field this filter maps to. */
  resourceField: string | null;
  /** Initial facet values attached to the filter. */
  facetValues: AdminFacetValueCreateModel[];
}
