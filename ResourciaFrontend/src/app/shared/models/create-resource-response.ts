<<<<<<< HEAD
import { ResourceModel } from "./resource";

export interface CreateResourceResponseModel extends ResourceModel {
=======
import { ResourceDetailModel } from "./resource-detail";

export interface CreateResourceResponseModel extends ResourceDetailModel {
>>>>>>> 9c2cef82cc7c9f538a77c944e04c4cb51252b045
  facets?: Record<string, string[]>;
}