/**
 * Histogram entry for rating distribution charts.
 */
export interface RatingDistributionItem {
    /** Star value (1-5). */
    stars: number;
    /** Number of ratings at this star value. */
    count: number;
}
