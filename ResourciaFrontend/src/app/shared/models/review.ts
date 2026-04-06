export interface Review {
  id: string | null;
  username: string;
  avatarUrl?: string | null;
  createdAt: string;
  rating: number;
  content: string;
  upvotes: number;
  downvotes: number;
  userVote: boolean | null;
}
