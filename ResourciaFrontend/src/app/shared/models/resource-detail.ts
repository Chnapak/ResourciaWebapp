import { ResourceModel } from "./resource";
import { RatingsModel } from "./ratings";
import { FacetModel } from "./facet";

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
  createdAtUtc: string; // ISO string; can convert to Date if you want
  updatedAtUtc: string;
  reviews: any[];     // TODO: define proper type if known
  discussions: any[];         // TODO: define proper type if known
}