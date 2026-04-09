import { DiscussionReply } from "./discussion-reply";

export interface DiscussionThread {
  id: string;
  username: string,
  avatarUrl?: string | null;
  createdAt: string;
  content: string;
  replies: DiscussionReply[];
}
