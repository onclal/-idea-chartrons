import { useEffect, useState, type FormEvent } from 'react';
import { useTranslation } from 'react-i18next';
import type { Review, ReviewSummary } from '@idea-chartrons/shared';
import { Button, Input, Textarea } from './ui';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { formatDate } from '../lib/format';
import { addReview, getAverageRating, getReviewsForMerchant } from '../services/reviewService';

interface MerchantReviewsProps {
  merchantId: string;
  onSummaryChange?: (summary: ReviewSummary) => void;
}

function Stars({ value, interactive, onSelect, label }: {
  value: number;
  interactive?: boolean;
  onSelect?: (rating: number) => void;
  label: string;
}) {
  return (
    <div className="inline-flex items-center gap-0.5" role={interactive ? 'radiogroup' : undefined} aria-label={label}>
      {[1, 2, 3, 4, 5].map((star) => {
        const filled = star <= value;
        const className = `text-lg leading-none ${filled ? 'text-chartrons-brass' : 'text-chartrons-sand'} ${
          interactive ? 'cursor-pointer hover:scale-110 transition-transform' : ''
        }`;
        if (!interactive) {
          return (
            <span key={star} className={className} aria-hidden>
              ★
            </span>
          );
        }
        return (
          <button
            key={star}
            type="button"
            role="radio"
            aria-checked={star === value}
            aria-label={`${star}`}
            className={`${className} touch-target min-h-0 min-w-0 p-1`}
            onClick={() => onSelect?.(star)}
          >
            ★
          </button>
        );
      })}
    </div>
  );
}

export function MerchantReviews({ merchantId, onSummaryChange }: MerchantReviewsProps) {
  const { t, i18n } = useTranslation();
  const { currentUser } = useAuth();
  const { showToast } = useToast();
  const [reviews, setReviews] = useState<Review[]>(() => getReviewsForMerchant(merchantId));
  const [summary, setSummary] = useState<ReviewSummary>(() => getAverageRating(merchantId));
  const [rating, setRating] = useState(5);
  const [authorName, setAuthorName] = useState('');
  const [comment, setComment] = useState('');
  const [error, setError] = useState('');

  const refresh = () => {
    const nextReviews = getReviewsForMerchant(merchantId);
    const nextSummary = getAverageRating(merchantId);
    setReviews(nextReviews);
    setSummary(nextSummary);
    onSummaryChange?.(nextSummary);
  };

  useEffect(() => {
    const nextReviews = getReviewsForMerchant(merchantId);
    const nextSummary = getAverageRating(merchantId);
    setReviews(nextReviews);
    setSummary(nextSummary);
    onSummaryChange?.(nextSummary);
    setRating(5);
    setAuthorName(currentUser?.nom ?? '');
    setComment('');
    setError('');
    // Refresh when the listing changes, not when the parent re-renders.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [merchantId, currentUser?.nom]);

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault();
    event.stopPropagation();
    if (!authorName.trim() || !comment.trim() || rating < 1) {
      setError(t('acteurs.reviews.required'));
      return;
    }
    addReview(merchantId, {
      merchantId,
      authorName,
      rating,
      comment,
      status: 'approved',
    });
    setComment('');
    setRating(5);
    setError('');
    refresh();
    showToast(t('acteurs.reviews.thanks'));
  };

  return (
    <section
      className="mt-3 rounded-2xl border border-chartrons-beige bg-chartrons-beige/30 p-3 space-y-3"
      onClick={(event) => event.stopPropagation()}
    >
      <div>
        <h4 className="text-sm font-semibold text-chartrons-olive-dark">{t('acteurs.reviews.title')}</h4>
        {summary.count > 0 ? (
          <p className="mt-1 flex items-center gap-2 text-sm font-semibold text-chartrons-olive-dark">
            <Stars value={Math.round(summary.rating)} label={t('acteurs.reviews.ratingLabel')} />
            <span>
              {t('acteurs.reviews.average', {
                rating: summary.rating.toFixed(1),
                count: summary.count,
              })}
            </span>
          </p>
        ) : (
          <p className="mt-1 text-xs text-chartrons-olive-dark/70">{t('acteurs.reviews.empty')}</p>
        )}
      </div>

      {reviews.length > 0 && (
        <ul className="space-y-2 max-h-56 overflow-y-auto pr-1">
          {reviews.map((review) => (
            <li
              key={review.id}
              className="rounded-xl bg-white border border-chartrons-beige px-3 py-2.5"
            >
              <div className="flex items-start justify-between gap-2">
                <p className="text-sm font-semibold text-chartrons-olive-dark">{review.authorName}</p>
                <Stars value={review.rating} label={`${review.rating}/5`} />
              </div>
              <p className="mt-1 text-sm text-chartrons-olive-dark/80 leading-relaxed">{review.comment}</p>
              <p className="mt-1 text-[11px] text-chartrons-warm-gray">
                {formatDate(review.createdAt, i18n.language)}
              </p>
            </li>
          ))}
        </ul>
      )}

      <form onSubmit={handleSubmit} className="space-y-3 pt-1 border-t border-chartrons-beige">
        <p className="text-xs font-semibold uppercase tracking-wide text-chartrons-olive-dark">
          {t('acteurs.reviews.formTitle')}
        </p>
        <div>
          <p className="block text-xs font-semibold text-chartrons-olive-dark uppercase tracking-wide mb-1">
            {t('acteurs.reviews.ratingLabel')}
          </p>
          <Stars
            value={rating}
            interactive
            onSelect={(next) => {
              setRating(next);
              setError('');
            }}
            label={t('acteurs.reviews.ratingLabel')}
          />
        </div>
        <Input
          label={t('acteurs.reviews.author')}
          value={authorName}
          onChange={(event) => {
            setAuthorName(event.target.value);
            setError('');
          }}
          placeholder={t('acteurs.reviews.authorPlaceholder')}
          autoComplete="name"
        />
        <Textarea
          label={t('acteurs.reviews.comment')}
          value={comment}
          onChange={(event) => {
            setComment(event.target.value);
            setError('');
          }}
          placeholder={t('acteurs.reviews.commentPlaceholder')}
          rows={3}
        />
        {error ? <p className="text-sm text-chartrons-brick">{error}</p> : null}
        <Button type="submit" variant="primary" className="w-full">
          {t('acteurs.reviews.submit')}
        </Button>
      </form>
    </section>
  );
}
