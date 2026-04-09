import { FacetModel } from './facet';
import { RatingsModel } from './ratings';

export interface SearchResultResourceModel {
  id: string;
  title: string;
  description?: string | null;
  url: string;
  isFree: boolean;
  year?: number | null;
  author?: string | null;
  learningStyle?: string | null;
  tags: string[];
  createdBy?: string | null;
  createdAtUtc: string;
  imageUrl?: string | null;
  ratings?: Pick<RatingsModel, 'averageRating' | 'totalCount'> | null;
  facets: FacetModel[];
}
