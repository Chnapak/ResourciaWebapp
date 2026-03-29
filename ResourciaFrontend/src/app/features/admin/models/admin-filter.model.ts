import { FilterKind } from "../../../shared/models/filter-kind";

export interface AdminFilter {
  id: string;
  key: string;
  label: string;
  description: string;
  kind: FilterKind;
  isActive: boolean;
  sortOrder: number;
  resourceField: string | null;
  resourceCount: number;
  lastChangeAt: string;
}
