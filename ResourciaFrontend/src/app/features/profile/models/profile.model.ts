export type UserRole = 'contributor' | 'educator' | 'student' | 'admin' | 'moderator';
export type ActivityType = 'shared_resource' | 'wrote_review' | 'saved_resource' | 'joined';
export type Tab = 'resources' | 'saved' | 'reviews' | 'activity';

export interface ProfileTab {
  key: Tab;
  label: string;
  count: number | null;
}

export interface ProfileResource {
  id: string;
  title: string;
  domain: string;
  type: string;
  rating: number;
  ratingCount: number;
  saves: number;
  addedAt: string;
}

export interface ProfileReview {
  id: string;
  resourceTitle: string;
  resourceId: string;
  rating: number;
  body: string;
  helpful: number;
  notHelpful: number;
  postedAt: string;
}

export interface ProfileActivity {
  id: string;
  type: ActivityType;
  description: string;
  target?: string;
  targetId?: string;
  timestamp: string;
}

export interface ProfileStats {
  resourcesShared: number;
  reviewsWritten: number;
  helpfulVotes: number;
  resourcesSaved: number;
}

export interface ProfileViewModel {
  id: string;
  name: string;
  handle: string;
  bio: string;
  avatarInitials: string;
  role: UserRole;
  isVerified: boolean;
  joinedAt: string;
  lastActive: string;
  location?: string;
  website?: string;
  interests: string[];
  stats: ProfileStats;
  sharedResources: ProfileResource[];
  savedResources: ProfileResource[];
  recentReviews: ProfileReview[];
  recentActivity: ProfileActivity[];
}
