export interface CreateResourceRequestModel {
  title: string;
  description?: string | null;
  url: string;

  // facet key -> list of facet slugs (FacetValues.Value)
  facets?: Record<string, string[]>;

  // optional direct fields (match your API DTO)
  isFree?: boolean | null;
  year?: number | null;
  author?: string | null;
  learningStyle?: string | null;
  tags?: string[] | null;
  rating?: number | null;
}
