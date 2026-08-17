import { useTranslation } from 'react-i18next';

interface PlaceMetaProps {
  rating?: number | null;
  reviewsCount?: number | null;
  openingHours?: string | null;
  specialite?: string | null;
}

export function PlaceMeta({ rating, reviewsCount, openingHours, specialite }: PlaceMetaProps) {
  const { t } = useTranslation();
  const hasRating = rating != null && rating > 0;
  if (!hasRating && !openingHours && !specialite) return null;

  return (
    <div className="mt-2 space-y-1">
      {specialite ? (
        <p className="text-xs font-medium text-chartrons-olive-dark">{specialite}</p>
      ) : null}
      {hasRating ? (
        <p className="text-xs text-chartrons-olive-dark font-semibold">
          ★ {t('acteurs.rating', { rating: rating.toFixed(1), count: reviewsCount ?? 0 })}
        </p>
      ) : null}
      {openingHours ? (
        <p className="text-xs text-chartrons-olive-dark/75">
          🕒 {t('acteurs.hours')} : {openingHours}
        </p>
      ) : null}
    </div>
  );
}
