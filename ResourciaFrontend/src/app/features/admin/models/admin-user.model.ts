/**
 * Admin-facing user models and list response types.
 */
export type UserStatus = 'active' | 'suspended' | 'banned';
export type UserRole = 'admin' | 'contributor';

/**
 * Represents a single user entry in the admin list.
 */
export interface AdminUser {
  /** Unique id of the user. */
  id: string;
  /** Display name of the user. */
  name: string;
  /** Public handle or username. */
  handle: string;
  /** Email address for the user. */
  email: string;
  /** Role assigned to the user. */
  role: UserRole;
  /** Human-readable role label for display. */
  roleLabel: string;
  /** Current moderation status. */
  status: UserStatus;
  /** Number of resources submitted by the user. */
  resourcesCount: number;
  /** ISO timestamp of the user's last activity. */
  lastActiveAt: string;
}

/**
 * Paged response wrapper for admin user lists.
 */
export interface AdminUsersResponse {
  /** Current page of users. */
  items: AdminUser[];
  /** Total number of matching users. */
  totalCount: number;
  /** Current page index. */
  page: number;
  /** Size of each page. */
  pageSize: number;
}
