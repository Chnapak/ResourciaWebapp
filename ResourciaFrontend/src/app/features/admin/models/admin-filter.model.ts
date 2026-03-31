import { FilterKind } from "../../../shared/models/filter-kind";

export interface AdminFacetValue {
  id: string;
  value: string;
  label: string;
  sortOrder: number;
}

export interface AdminFilter {
  id: string;
  key: string;
  label: string;
  description: string | null;
  kind: FilterKind;
  isMulti: boolean;
  isActive: boolean;
  sortOrder: number;
  resourceField: string | null;
  facetValues: AdminFacetValue[];
  resourceCount: number;
  createdAt: string;
  createdBy: string;
  lastChangeAt: string;
  modifiedBy: string | null;
}
