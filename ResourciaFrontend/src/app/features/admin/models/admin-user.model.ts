export type UserStatus = 'active' | 'suspended' | 'banned';
export type UserPlan = 'free' | 'pro' | 'team';

export interface AdminUser {
  id: string;
  name: string;
  email: string;
  plan: UserPlan;
  status: UserStatus;
  resourcesCount: number;
  lastActiveAt: string; // or Date, depending on your API
}
