import { ResourceDetailModel } from "./resource-detail";

export interface SearchResponse {
    items: ResourceDetailModel[],
    page: number,
    pageSize: number,
    totalItems: number,
    totalPages: number
}
