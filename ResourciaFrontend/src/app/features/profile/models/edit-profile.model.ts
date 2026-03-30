/**
 * EditProfileForm represents the profile fields currently editable in the UI.
 *
 * The current backend only exposes profile data through GET /api/Profile/{identifier}.
 * Saving richer profile fields is not wired yet, so this form is currently used
 * for live preview and local draft persistence.
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
