/**
 * Admin-facing filter models used to manage search facets.
 */
import { FilterKind } from "../../../shared/models/filter-kind";

/**
 * Represents a single selectable value inside a facet filter.
 */
export interface AdminFacetValue {
  /** Unique id of the facet value. */
  id: string;
  /** Raw value persisted for filtering. */
  value: string;
  /** Human-friendly label shown in the UI. */
  label: string;
  /** Sort order within the facet value list. */
  sortOrder: number;
}

/**
 * Represents an admin-configurable filter definition.
 */
export interface AdminFilter {
  /** Unique id of the filter. */
  id: string;
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
  /** Whether the filter is active and visible. */
  isActive: boolean;
  /** Sort order in the filter list. */
  sortOrder: number;
  /** Optional resource field this filter maps to. */
  resourceField: string | null;
  /** Available facet values for this filter. */
  facetValues: AdminFacetValue[];
  /** Number of resources matching this filter. */
  resourceCount: number;
  /** ISO date when the filter was created. */
  createdAt: string;
  /** Identifier of the user who created the filter. */
  createdBy: string;
  /** ISO date of the last change. */
  lastChangeAt: string;
  /** Identifier of the last user who modified the filter. */
  modifiedBy: string | null;
}
