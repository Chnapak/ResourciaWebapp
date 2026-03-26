import { DiscussionReply } from "./discussion-reply";

export interface DiscussionThread {
  id: string;
  username: string,
  createdAt: string;
  content: string;
  replies: DiscussionReply[];
}