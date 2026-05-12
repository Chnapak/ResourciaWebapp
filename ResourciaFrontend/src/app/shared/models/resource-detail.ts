import { ResourceModel } from "./resource";
import { RatingsModel } from "./ratings";
import { FacetModel } from "./facet";
import { Review } from "./review";
import { DiscussionThread } from "./discussion-thread";

export interface ResourceDetailModel extends ResourceModel {
  description: string;
  isFree: boolean;
  year: number;
  author: string;
  learningStyle: string;
  tags: string[]; // assuming simple string array
  facets: FacetModel[];
  ratings?: RatingsModel;
  savesCount: number;
  isSavedByCurrentUser?: boolean;
  createdBy?: string | null;
  createdAtUtc: string; // ISO string; can convert to Date if you want
  updatedAtUtc: string;
  reviews: Review[];
  discussions: DiscussionThread[];
}
