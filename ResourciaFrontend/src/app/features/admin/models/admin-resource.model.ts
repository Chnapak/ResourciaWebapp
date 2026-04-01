/**
 * Admin-facing resource summary for moderation lists.
 */
export interface AdminResource {
  /** Unique id of the resource. */
  id: string;
  /** Title displayed in the admin list. */
  title: string;
  /** Canonical URL for the resource. */
  url: string;
  /** Identifier of the user who created the resource. */
  createdBy: string | null;
  /** Number of times the resource was saved. */
  savesCount: number;
  /** Number of reviews on the resource. */
  reviewCount: number;
  /** ISO timestamp when the resource was created. */
  createdAtUtc: string;
  /** ISO timestamp when the resource was last updated. */
  updatedAtUtc: string;
  /** Whether the resource has been soft-deleted. */
  isDeleted: boolean;
  /** ISO timestamp of deletion, if deleted. */
  deletedAtUtc: string | null;
}
