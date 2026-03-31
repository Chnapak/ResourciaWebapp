import { FilterKind } from "../../../shared/models/filter-kind";

export interface AdminFacetValueCreateModel {
  label: string;
}

export interface AdminFilterCreateModel {
  key: string;
  label: string;
  description: string | null;
  kind: FilterKind;
  isMulti: boolean;
  isActive: boolean;
  resourceField: string | null;
  facetValues: AdminFacetValueCreateModel[];
}
