import { ResourceDetailModel } from '../models/resource-detail';

export interface CreateResourceResponseModel extends ResourceDetailModel {
  facets?: Record<string, string[]>;
}
