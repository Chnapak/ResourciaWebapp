import { SearchResultResourceModel } from "./search-result-resource";

export interface SearchResponse {
    items: SearchResultResourceModel[],
    page: number,
    pageSize: number,
    totalItems: number,
    totalPages: number
}
