export type UserStatus = 'active' | 'suspended' | 'banned';
export type UserRole = 'admin' | 'contributor';

export interface AdminUser {
  id: string;
  name: string;
  handle: string;
  email: string;
  role: UserRole;
  roleLabel: string;
  status: UserStatus;
  resourcesCount: number;
  lastActiveAt: string;
}

export interface AdminUsersResponse {
  items: AdminUser[];
  totalCount: number;
  page: number;
  pageSize: number;
}
