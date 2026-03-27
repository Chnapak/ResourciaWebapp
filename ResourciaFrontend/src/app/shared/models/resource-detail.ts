import { ResourceModel } from "./resource";

export interface ResourceDetailModel extends ResourceModel {
  description: string;
  isFree: boolean;
  year: number;
  author: string;
  learningStyle: string;
  tags: string[]; // assuming simple string array
  rating: number;
  savesCount: number;
  createdAtUtc: string; // ISO string; can convert to Date if you want
  updatedAtUtc: string;
  resourceFacetValues: any[]; // TODO: define proper type if known
  resourceReviews: any[];     // TODO: define proper type if known
  discussions: any[];         // TODO: define proper type if known
}