import {
  clampReviewRating,
  isReviewStatus,
  summarizeReviews,
  type NewReviewInput,
  type Review,
  type ReviewSummary,
} from '@idea-chartrons/shared';
import { writeLocalStorage } from '../lib/storage';

export const REVIEWS_STORAGE_KEY = 'idea-chartrons-reviews';

const MAX_REVIEWS = 200;

function createId(): string {
  return `review-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function asNonEmptyString(value: unknown): string | null {
  if (typeof value !== 'string') return null;
  const trimmed = value.trim();
  return trimmed ? trimmed : null;
}

function asReview(value: unknown): Review | null {
  if (!value || typeof value !== 'object') return null;
  const row = value as Record<string, unknown>;
  const id = asNonEmptyString(row.id);
  const merchantId = asNonEmptyString(row.merchantId);
  const authorName = asNonEmptyString(row.authorName);
  const comment = asNonEmptyString(row.comment);
  const createdAt = asNonEmptyString(row.createdAt);
  const rating = clampReviewRating(Number(row.rating));
  const status = isReviewStatus(row.status) ? row.status : 'approved';
  if (!id || !merchantId || !authorName || !comment || !createdAt) return null;
  if (Number.isNaN(new Date(createdAt).getTime())) return null;
  return { id, merchantId, authorName, rating, comment, createdAt, status };
}

function demoReviews(): Review[] {
  return [
    {
      id: 'review-demo-cafe-1',
      merchantId: 'acteur-2',
      authorName: 'Léa M.',
      rating: 5,
      comment: 'Terrasse ombragée, café excellent et accueil chaleureux. Un vrai coin de quartier.',
      createdAt: '2026-08-10T09:20:00.000Z',
      status: 'approved',
    },
    {
      id: 'review-demo-cafe-2',
      merchantId: 'acteur-2',
      authorName: 'Marc D.',
      rating: 4,
      comment: 'Menu du jour copieux. Un peu d’attente le dimanche, mais ça vaut le détour.',
      createdAt: '2026-08-12T14:05:00.000Z',
      status: 'approved',
    },
    {
      id: 'review-demo-brocante-1',
      merchantId: 'acteur-1',
      authorName: 'Sophie B.',
      rating: 5,
      comment: 'Très belle sélection vintage, conseils précis. J’ai trouvé une commode parfaite.',
      createdAt: '2026-08-08T16:40:00.000Z',
      status: 'approved',
    },
    {
      id: 'review-demo-bistro-1',
      merchantId: 'acteur-poi-rest-001',
      authorName: 'Nicolas P.',
      rating: 4,
      comment: 'Cuisine de saison et cadre Notre-Dame. On y retourne volontiers.',
      createdAt: '2026-08-14T19:10:00.000Z',
      status: 'approved',
    },
  ];
}

function readAllReviews(): Review[] {
  try {
    const raw = localStorage.getItem(REVIEWS_STORAGE_KEY);
    if (!raw) {
      const seeded = demoReviews();
      writeLocalStorage(REVIEWS_STORAGE_KEY, JSON.stringify(seeded));
      return seeded;
    }
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.map(asReview).filter((review): review is Review => review !== null);
  } catch {
    return [];
  }
}

function persistReviews(reviews: Review[]): void {
  writeLocalStorage(REVIEWS_STORAGE_KEY, JSON.stringify(reviews.slice(0, MAX_REVIEWS)));
}

export function getReviewsForMerchant(merchantId: string): Review[] {
  return readAllReviews()
    .filter((review) => review.merchantId === merchantId && review.status === 'approved')
    .sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1));
}

export function addReview(merchantId: string, review: NewReviewInput): void {
  const authorName = review.authorName.trim();
  const comment = review.comment.trim();
  if (!merchantId.trim() || !authorName || !comment) return;

  const next: Review = {
    id: createId(),
    merchantId: merchantId.trim(),
    authorName,
    rating: clampReviewRating(review.rating),
    comment,
    createdAt: new Date().toISOString(),
    status: isReviewStatus(review.status) ? review.status : 'approved',
  };

  persistReviews([next, ...readAllReviews()]);
}

export function getAverageRating(merchantId: string): ReviewSummary {
  return summarizeReviews(getReviewsForMerchant(merchantId));
}
