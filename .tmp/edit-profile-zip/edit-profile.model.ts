/**
 * EditProfileForm represents the fields the user can edit.
 *
 * Backend availability:
 * - username:    ✅ Backed — stored via POST /api/Auth/CompleteExternalLogin; editable flow TBD
 * - displayName: ✅ Backed — stored as userName on the account
 * - bio:         🔜 Future — field not yet persisted by backend
 * - location:    🔜 Future — field not yet persisted by backend
 * - website:     🔜 Future — field not yet persisted by backend
 * - interests:   🔜 Future — not yet persisted (shown on profile but not settable via API)
 * - avatarUrl:   🔜 Future — no upload endpoint exists yet
 */
export interface EditProfileForm {
  /** Shown as @username on public profile. Backed ✅ */
  username: string;

  /** Display name shown as heading. Backed ✅ */
  displayName: string;

  /** Short bio shown below name. Future 🔜 */
  bio: string;

  /** City / region. Future 🔜 */
  location: string;

  /** Personal or portfolio URL. Future 🔜 */
  website: string;

  /** Subject/topic interest tags. Future 🔜 */
  interests: string[];

  /** Avatar image URL (upload not yet supported). Future 🔜 */
  avatarUrl: string | null;
}

export interface EditProfileField {
  key: keyof EditProfileForm;
  label: string;
  helperText: string;
  isBackedByBackend: boolean;
  placeholder?: string;
}

export const EDIT_PROFILE_FIELDS: EditProfileField[] = [
  {
    key: 'displayName',
    label: 'Display Name',
    helperText: 'This is the name shown at the top of your public profile.',
    isBackedByBackend: true,
    placeholder: 'Your full name or alias',
  },
  {
    key: 'username',
    label: 'Username',
    helperText: 'Your public @handle. Appears in your profile URL.',
    isBackedByBackend: true,
    placeholder: 'username',
  },
  {
    key: 'bio',
    label: 'Bio',
    helperText: 'A short description of who you are and what you share.',
    isBackedByBackend: false,
    placeholder: 'Educator, researcher, lifelong learner…',
  },
  {
    key: 'location',
    label: 'Location',
    helperText: 'City, country, or region — however specific you'd like.',
    isBackedByBackend: false,
    placeholder: 'Prague, Czech Republic',
  },
  {
    key: 'website',
    label: 'Website',
    helperText: 'Your personal site, portfolio, or institutional page.',
    isBackedByBackend: false,
    placeholder: 'https://yoursite.com',
  },
];

export type SaveStatus = 'idle' | 'saving' | 'saved' | 'error';
