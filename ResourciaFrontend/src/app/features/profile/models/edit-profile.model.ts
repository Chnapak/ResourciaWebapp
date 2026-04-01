/**
 * EditProfileForm represents the editable profile fields backed by the
 * profile API. Avatar upload is intentionally separate because it still
 * needs its own backend media flow.
 */
export interface EditProfileForm {
  /** Display name shown publicly. */
  displayName: string;
  /** Unique username/handle. */
  username: string;
  /** Short bio or tagline. */
  bio: string;
  /** Optional location string. */
  location: string;
  /** Optional personal website URL. */
  website: string;
  /** List of interest tags. */
  interests: string[];
  /** Current avatar URL (or null when unset). */
  avatarUrl: string | null;
}

/**
 * Save status used to drive UI feedback.
 */
export type SaveStatus = 'idle' | 'saving' | 'saved' | 'error';
