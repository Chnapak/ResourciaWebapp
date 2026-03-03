import { FilterKind } from "../../../shared/models/filter-kind";

export interface AdminFilter {
  id: string;
  key: string;
  label: string;
  description: string;
  kind: FilterKind;
  isActive: boolean;

  // ordering (important for drag-reorder)
  sortOrder: number;

  // usage / metadata
  resourceCount: number;
  modifiedAt: string; // or Date, same rule as User.lastActiveAt
}
