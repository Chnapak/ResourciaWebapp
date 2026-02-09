import { FilterKind } from "../../../shared/models/filter-kind";

export interface AdminFilter {
  id: string;
  key: string;
  name: string;
  kind: FilterKind;
  enabled: boolean;

  // ordering (important for drag-reorder)
  order: number;

  // usage / metadata
  resourcesCount: number;
  updatedAt: string; // or Date, same rule as User.lastActiveAt
}
