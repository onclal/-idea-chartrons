export type ReviewStatus = 'approved' | 'pending';

export interface Review {
  id: string;
  merchantId: string;
  authorName: string;
  rating: number;
  comment: string;
  createdAt: string;
  status: ReviewStatus;
}

export interface ReviewSummary {
  rating: number;
  count: number;
}

export type NewReviewInput = Omit<Review, 'id' | 'createdAt'>;

export function isReviewStatus(value: unknown): value is ReviewStatus {
  return value === 'approved' || value === 'pending';
}

export function clampReviewRating(value: number): number {
  if (!Number.isFinite(value)) return 1;
  return Math.min(5, Math.max(1, Math.round(value)));
}

export function summarizeReviews(reviews: Review[]): ReviewSummary {
  const approved = reviews.filter((review) => review.status === 'approved');
  if (approved.length === 0) return { rating: 0, count: 0 };
  const total = approved.reduce((sum, review) => sum + review.rating, 0);
  return {
    rating: Math.round((total / approved.length) * 10) / 10,
    count: approved.length,
  };
}
