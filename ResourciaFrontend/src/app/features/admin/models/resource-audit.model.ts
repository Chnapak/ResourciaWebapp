export type ResourceAuditActionType =
  | 'create'
  | 'update'
  | 'softDelete'
  | 'restore'
  | 'revert'
  | 'imageAdd'
  | 'imageDelete'
  | 'filtersUpdate';

export interface ResourceAuditEntryListItem {
  id: string;
  actionType: ResourceAuditActionType;
  createdAtUtc: string;
  actorDisplayName?: string | null;
  actorRole?: string | null;
  source: string;
  reason?: string | null;
  revertedAuditId?: string | null;
}

export interface ResourceAuditEntryListResponse {
  resourceId: string;
  resourceTitle?: string | null;
  isDeleted: boolean;
  items: ResourceAuditEntryListItem[];
  totalCount: number;
  page: number;
  pageSize: number;
}

export interface ResourceAuditSnapshot {
  id: string;
  title: string;
  description?: string | null;
  url: string;
  isFree: boolean;
  year?: number | null;
  author?: string | null;
  learningStyle: string;
  tags: string[];
  createdBy?: string | null;
  deletedAtUtc?: string | null;
  deletedBy?: string | null;
  filterValues: ResourceAuditFilterValue[];
  images: ResourceAuditImage[];
}

export interface ResourceAuditFilterValue {
  filterDefinitionsId: string;
  key: string;
  facetValuesId?: string | null;
  facetValue?: string | null;
  facetLabel?: string | null;
  stringValue?: string | null;
  numberValue?: number | null;
  booleanValue?: boolean | null;
}

export interface ResourceAuditImage {
  id: string;
  fileName: string;
  originalFileName: string;
  contentType: string;
  uploadedAtUtc: string;
  uploadedByUserId: string;
  isDeleted: boolean;
  deletedAtUtc?: string | null;
  deletedByUserId?: string | null;
}

export interface ResourceAuditDiffItem {
  field: string;
  before?: any;
  after?: any;
  added?: string[] | null;
  removed?: string[] | null;
  warnings?: string[] | null;
}

export interface ResourceAuditEntryDetail {
  id: string;
  actionType: ResourceAuditActionType;
  createdAtUtc: string;
  actorDisplayName?: string | null;
  actorRole?: string | null;
  source: string;
  reason?: string | null;
  revertedAuditId?: string | null;
  before?: ResourceAuditSnapshot | null;
  after?: ResourceAuditSnapshot | null;
  diff: ResourceAuditDiffItem[];
}

export interface ResourceRevertRequest {
  auditId: string;
  reason: string;
}
