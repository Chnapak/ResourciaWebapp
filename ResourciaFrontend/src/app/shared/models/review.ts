export interface Review {
  id: string;
  username: string;
  createdAt: string;
  rating: number;
  content: string;
  upvotes: number;
  downvotes: number;
}