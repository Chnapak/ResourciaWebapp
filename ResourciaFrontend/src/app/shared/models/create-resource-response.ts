import { ResourceDetailModel } from "./resource-detail";

export interface CreateResourceResponseModel extends ResourceDetailModel {
  facets?: Record<string, string[]>;
}