export type ReviewTier = 'low' | 'medium' | 'high';

export interface RatingsData {
  averageRating: number;
  totalCount: number;
  count1?: number;
  count2?: number;
  count3?: number;
  count4?: number;
  count5?: number;
}

export interface StarDistributionItem {
  stars: number;
  count: number;
}

export class RatingUtils {
  constructor(private ratings: RatingsData | null | undefined) {}

  private get avgScore(): number {
    return this.ratings?.averageRating ?? 0;
  }

  private get totalRatings(): number {
    return this.ratings?.totalCount ?? 0;
  }

  getPercentage(count: number): number {
    if (!this.totalRatings) return 0;
    return (count / this.totalRatings) * 100;
  }

  getStarFill(starIndex: number): number {
    const fill = this.avgScore - (starIndex - 1);
    return Math.max(0, Math.min(1, fill));
  }

  getReviewTier(): ReviewTier {
    if (this.totalRatings < 5) return 'low';
    if (this.totalRatings < 25) return 'medium';
    return 'high';
  }

  getSentiment(): string {
    if (!this.totalRatings) return 'No ratings';

    const tier = this.getReviewTier();

    if (tier === 'low') {
      if (this.avgScore >= 4.2) return 'Positive';
      if (this.avgScore >= 2.6) return 'Mixed';
      return 'Negative';
    }

    if (tier === 'medium') {
      if (this.avgScore >= 4.6) return 'Very Positive';
      if (this.avgScore >= 3.8) return 'Mostly Positive';
      if (this.avgScore >= 2.6) return 'Mixed';
      if (this.avgScore >= 1.8) return 'Mostly Negative';
      return 'Very Negative';
    }

    if (this.avgScore >= 4.8) return 'Overwhelmingly Positive';
    if (this.avgScore >= 4.2) return 'Very Positive';
    if (this.avgScore >= 3.8) return 'Mostly Positive';
    if (this.avgScore >= 2.6) return 'Mixed';
    if (this.avgScore >= 1.8) return 'Mostly Negative';
    return 'Overwhelmingly Negative';
  }

  getSentimentClasses(): string {
    if (!this.totalRatings) return 'bg-gray-50 text-gray-500';

    const tier = this.getReviewTier();

    if (tier === 'low') {
      if (this.avgScore >= 4.2) return 'bg-green-50 text-green-700';
      if (this.avgScore >= 2.6) return 'bg-yellow-50 text-yellow-700';
      return 'bg-red-50 text-red-700';
    }

    if (tier === 'medium') {
      if (this.avgScore >= 4.6) return 'bg-green-100 text-green-800';
      if (this.avgScore >= 3.8) return 'bg-green-50 text-green-700';
      if (this.avgScore >= 2.6) return 'bg-yellow-50 text-yellow-700';
      return 'bg-red-50 text-red-700';
    }

    if (this.avgScore >= 4.8) return 'bg-green-100 text-green-800';
    if (this.avgScore >= 4.2) return 'bg-green-50 text-green-700';
    if (this.avgScore >= 3.8) return 'bg-yellow-50 text-yellow-700';
    if (this.avgScore >= 2.6) return 'bg-orange-50 text-orange-700';
    if (this.avgScore >= 1.8) return 'bg-red-50 text-red-700';

    return 'bg-red-100 text-red-800';
  }

  getDistribution(): StarDistributionItem[] {
    if (!this.ratings) return [];

    return [
      { stars: 5, count: this.ratings.count5 ?? 0 },
      { stars: 4, count: this.ratings.count4 ?? 0 },
      { stars: 3, count: this.ratings.count3 ?? 0 },
      { stars: 2, count: this.ratings.count2 ?? 0 },
      { stars: 1, count: this.ratings.count1 ?? 0 },
    ];
  }
}