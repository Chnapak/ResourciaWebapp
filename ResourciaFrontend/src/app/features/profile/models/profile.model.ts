/**
 * Profile domain models for the public profile view.
 */
export type UserRole = 'contributor' | 'educator' | 'student' | 'admin' | 'moderator';
export type ActivityType = 'shared_resource' | 'wrote_review' | 'saved_resource' | 'joined';
export type Tab = 'resources' | 'saved' | 'reviews' | 'activity';

/**
 * Definition of a profile tab with a count.
 */
export interface ProfileTab {
  /** Tab key identifier. */
  key: Tab;
  /** Display label for the tab. */
  label: string;
  /** Optional count badge shown for the tab. */
  count: number | null;
}

/**
 * Summary of a resource shown on a profile.
 */
export interface ProfileResource {
  /** Resource id. */
  id: string;
  /** Resource title. */
  title: string;
  /** Domain extracted from the resource URL. */
  domain: string;
  /** Resource type label. */
  type: string;
  /** Average rating value. */
  rating: number;
  /** Total number of ratings. */
  ratingCount: number;
  /** Number of saves. */
  saves: number;
  /** ISO timestamp when the resource was added. */
  addedAt: string;
}

/**
 * Review summary displayed on a profile.
 */
export interface ProfileReview {
  /** Review id. */
  id: string;
  /** Title of the reviewed resource. */
  resourceTitle: string;
  /** Id of the reviewed resource. */
  resourceId: string;
  /** Rating given in the review. */
  rating: number;
  /** Review text body. */
  body: string;
  /** Helpful votes count. */
  helpful: number;
  /** Not helpful votes count. */
  notHelpful: number;
  /** ISO timestamp when the review was posted. */
  postedAt: string;
}

/**
 * Activity timeline entry shown on a profile.
 */
export interface ProfileActivity {
  /** Activity id. */
  id: string;
  /** Activity type identifier. */
  type: ActivityType;
  /** Human-friendly description of the activity. */
  description: string;
  /** Optional target label (resource, review, etc.). */
  target?: string;
  /** Optional target id for deep links. */
  targetId?: string;
  /** ISO timestamp of the activity. */
  timestamp: string;
}

/**
 * Aggregated statistics for a profile.
 */
export interface ProfileStats {
  /** Number of resources shared. */
  resourcesShared: number;
  /** Number of reviews written. */
  reviewsWritten: number;
  /** Total helpful votes received. */
  helpfulVotes: number;
  /** Number of resources saved. */
  resourcesSaved: number;
}

/**
 * Full profile payload used by the profile page.
 */
export interface ProfileViewModel {
  /** User id. */
  id: string;
  /** Display name. */
  name: string;
  /** Public handle/username. */
  handle: string;
  /** Profile bio text. */
  bio: string;
  /** Initials derived for avatar display. */
  avatarInitials: string;
  /** Role assigned to the user. */
  role: UserRole;
  /** Whether the user is verified. */
  isVerified: boolean;
  /** ISO timestamp when the user joined. */
  joinedAt: string;
  /** ISO timestamp of last activity. */
  lastActive: string;
  /** Optional location string. */
  location?: string;
  /** Optional website URL. */
  website?: string;
  /** Interest tags displayed on the profile. */
  interests: string[];
  /** Aggregated profile statistics. */
  stats: ProfileStats;
  /** Resources shared by the user. */
  sharedResources: ProfileResource[];
  /** Resources saved by the user. */
  savedResources: ProfileResource[];
  /** Recent reviews written by the user. */
  recentReviews: ProfileReview[];
  /** Recent activity entries. */
  recentActivity: ProfileActivity[];
}
