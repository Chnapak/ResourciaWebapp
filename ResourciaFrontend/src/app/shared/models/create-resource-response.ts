import { ResourceModel } from "./resource";

export interface CreateResourceResponseModel extends ResourceModel {
  facets?: Record<string, string[]>;
}