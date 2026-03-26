import { Component, Input } from '@angular/core';
import { RatingDistributionItem } from '../../models/rating-distribution-item';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-resource-rating-overview',
  imports: [CommonModule],
  templateUrl: './resource-rating-overview.component.html',
  styleUrl: './resource-rating-overview.component.scss',
})
export class ResourceRatingOverviewComponent {
  @Input() avgScore: number = 1;
  @Input() totalRatings: number = 0;
  @Input() distribution: RatingDistributionItem[] = [];

  getPercentage(count: number): number {
    if (!this.totalRatings) return 0;
    return (count / this.totalRatings) * 100;
  }

  getStarFill(starIndex: number): number {
    const fill = this.avgScore - (starIndex - 1);
    return Math.max(0, Math.min(1, fill));
  }

  getSentiment(): string {
    if (!this.totalRatings) return 'No ratings';

    const tier = this.getReviewTier();

    // 🔴 LOW SAMPLE → be cautious
    if (tier === 'low') {
      if (this.avgScore >= 4.2) return 'Positive';
      if (this.avgScore >= 2.6) return 'Mixed';
      return 'Negative';
    }

    // 🟡 MEDIUM SAMPLE
    if (tier === 'medium') {
      if (this.avgScore >= 4.6) return 'Very Positive';
      if (this.avgScore >= 3.8) return 'Mostly Positive';
      if (this.avgScore >= 2.6) return 'Mixed';
      if (this.avgScore >= 1.8) return 'Mostly Negative';
      return 'Very Negative';
    }

    // 🟢 HIGH SAMPLE → full Steam labels
    if (this.avgScore >= 4.8) return 'Overwhelmingly Positive';
    if (this.avgScore >= 4.2) return 'Very Positive';
    if (this.avgScore >= 3.8) return 'Mostly Positive';
    if (this.avgScore >= 2.6) return 'Mixed';
    if (this.avgScore >= 1.8) return 'Mostly Negative';
    return 'Overwhelmingly Negative';
  }

  getSentimentClasses(): string {
    if (!this.totalRatings || this.totalRatings == 0) return 'bg-gray-50 text-gray-500';

    const tier = this.getReviewTier();

    // 🔴 LOW SAMPLE → muted colors (uncertain)
    if (tier === 'low') {
      if (this.avgScore >= 4.2) return 'bg-green-50 text-green-700';
      if (this.avgScore >= 2.6) return 'bg-yellow-50 text-yellow-700';
      return 'bg-red-50 text-red-700';
    }

    // 🟡 MEDIUM SAMPLE → softer confidence colors
    if (tier === 'medium') {
      if (this.avgScore >= 4.6) return 'bg-green-100 text-green-800';
      if (this.avgScore >= 3.8) return 'bg-green-50 text-green-700';
      if (this.avgScore >= 2.6) return 'bg-yellow-50 text-yellow-700';
      return 'bg-red-50 text-red-700';
    }

    // 🟢 HIGH SAMPLE → strong Steam-like confidence
    if (this.avgScore >= 4.8) return 'bg-green-100 text-green-800';
    if (this.avgScore >= 4.2) return 'bg-green-50 text-green-700';
    if (this.avgScore >= 3.8) return 'bg-yellow-50 text-yellow-700';
    if (this.avgScore >= 2.6) return 'bg-orange-50 text-orange-700';
    if (this.avgScore >= 1.8) return 'bg-red-50 text-red-700';

    return 'bg-red-100 text-red-800';
  }

  getReviewTier(): 'low' | 'medium' | 'high' {
    if (this.totalRatings < 5) return 'low';
    if (this.totalRatings < 25) return 'medium';
    return 'high';
  }
}
