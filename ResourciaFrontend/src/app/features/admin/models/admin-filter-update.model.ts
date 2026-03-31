export interface AdminFacetValueUpdateModel {
  id?: string;
  label: string;
}

export interface AdminFilterUpdateModel {
  label: string;
  description: string | null;
  facetValues: AdminFacetValueUpdateModel[];
}
