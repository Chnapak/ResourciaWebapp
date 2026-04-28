export interface BetaInvite {
  id: string;
  email: string;
  status: 'Pending' | 'Used' | 'Revoked';
  createdAtUtc: string;
  createdBy?: string | null;
  usedAtUtc?: string | null;
  usedByUserId?: string | null;
  revokedAtUtc?: string | null;
  revokedBy?: string | null;
}

export interface BetaInviteListResponse {
  registrationMode: 'FullRelease' | 'ClosedBeta' | string;
  items: BetaInvite[];
}
