/**
 * EditProfileForm represents the editable profile fields backed by the
 * profile API. Avatar upload is intentionally separate because it still
 * needs its own backend media flow.
 */
export interface EditProfileForm {
  displayName: string;
  username: string;
  bio: string;
  location: string;
  website: string;
  interests: string[];
  avatarUrl: string | null;
}

export type SaveStatus = 'idle' | 'saving' | 'saved' | 'error';
