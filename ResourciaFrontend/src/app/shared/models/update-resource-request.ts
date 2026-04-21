export interface UpdateResourceRequestModel {
  title?: string | null;
  description?: string | null;
  url?: string | null;

  facets?: Record<string, string[]>;
  filterValues?: Record<string, string[]>;

  isFree?: boolean | null;
  year?: number | null;
  author?: string | null;
  learningStyle?: string | null;
  tags?: string[] | null;
}
