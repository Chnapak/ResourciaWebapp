import { ResourceModel } from "./resource";

export interface ResourceDetailModel extends ResourceModel {
    description: string
    url: string
}