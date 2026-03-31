export interface CreateResourceRequestModel {
  title: string;
  description?: string | null;
  url: string;

  // Legacy selectable values payload.
  facets?: Record<string, string[]>;

  // Generic filter values keyed by filter key. This supports selectable values,
  // raw text values, booleans, and numeric values for filters without a mapped field.
  filterValues?: Record<string, string[]>;

  // optional direct fields (match your API DTO)
  isFree?: boolean | null;
  year?: number | null;
  author?: string | null;
  learningStyle?: string | null;
  tags?: string[] | null;
  rating?: number | null;
}
