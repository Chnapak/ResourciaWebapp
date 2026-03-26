export interface Review {
  id: string;
  username: string;
  date: string;
  rating: number;
  text: string;
  helpfulCount: number;
  notHelpfulCount: number;
  verified: boolean;
}