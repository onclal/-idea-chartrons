import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  hasQrVitrine,
  isNotreDameCertifiedDealer,
  isPremiumProMerchant,
  isRestaurantCategory,
  type ActeurLocal,
  type ReviewSummary,
} from '@idea-chartrons/shared';
import { Badge, Button, Card } from './ui';
import { BrandedCover, PlaceCover } from './PlaceCover';
import { resolveMediaUrl } from '../lib/media';
import { PhoneLink } from './PhoneLink';
import { EmailLink } from './EmailLink';
import { PlaceMeta } from './PlaceMeta';
import { MerchantSocialSection } from './MerchantSocialSection';
import { MerchantActionButtons } from './MerchantActionButtons';
import { MerchantReviews } from './MerchantReviews';
import { DailyMenuSection } from './DailyMenuSection';
import { RestaurantMenu } from './RestaurantMenu';
import { AdminDeleteButton } from './AdminDeleteButton';
import { QrCodeDisplay } from './QrCodeDisplay';
import { VipOfferCard } from './VipOfferCard';
import { getAverageRating } from '../services/reviewService';
import { AudioReader } from './AudioReader';
import { AccessibilityBadges } from './AccessibilityBadges';
import { DistanceBadge } from './DistanceBadge';

interface MerchantCardProps {
  acteur: ActeurLocal;
  isExpanded: boolean;
  carnetPoints: number;
  generatingQrId: string | null;
  canManageFidelite: boolean;
  onToggle: () => void;
  onUpdated: (acteur: ActeurLocal) => void;
  onAskQuestion: () => void;
  onDelete: () => Promise<void>;
  onGenerateQr: () => void;
  onSubscribePro?: () => void;
}

export function MerchantCard({
  acteur,
  isExpanded,
  carnetPoints,
  generatingQrId,
  canManageFidelite,
  onToggle,
  onUpdated,
  onAskQuestion,
  onDelete,
  onGenerateQr,
  onSubscribePro,
}: MerchantCardProps) {
  const { t } = useTranslation();
  const vip = isPremiumProMerchant(acteur);
  const [reviewSummary, setReviewSummary] = useState<ReviewSummary>(() => getAverageRating(acteur.id));

  useEffect(() => {
    setReviewSummary(getAverageRating(acteur.id));
  }, [acteur.id]);

  const coverSrc = resolveMediaUrl(acteur.photos[0]);

  return (
    <Card
      className="!p-0 overflow-hidden cursor-pointer bg-white text-chartrons-olive-dark"
      onClick={onToggle}
    >
      {coverSrc ? (
        <PlaceCover src={coverSrc} />
      ) : acteur.id === 'acteur-poi-cult-002' ? (
        <BrandedCover />
      ) : null}
      <div className="p-4">
        <div className="flex items-start justify-between gap-2">
          <div>
            <h3 className="font-semibold text-chartrons-olive-dark text-base">{acteur.nomCommerce}</h3>
            <div className="flex flex-wrap gap-1.5 mt-1.5">
              <Badge variant="olive">{t(`acteurs.categories.${acteur.categorie}`)}</Badge>
              {vip && (
                <Badge variant="vip" icon="⭐">{t('badges.premiumPro')}</Badge>
              )}
              {isNotreDameCertifiedDealer(acteur) && (
                <Badge variant="gold" icon="✦">{t('brocanteurs.certifiedBadge')}</Badge>
              )}
              {reviewSummary.count > 0 && (
                <Badge variant="gold">
                  {t('acteurs.reviews.badge', {
                    rating: reviewSummary.rating.toFixed(1),
                    count: reviewSummary.count,
                  })}
                </Badge>
              )}
              {!hasQrVitrine(acteur) && (
                <Badge variant="stone">{t('acteurs.qrOptional')}</Badge>
              )}
            </div>
          </div>
          <span className="text-chartrons-warm-gray text-sm">{isExpanded ? '▲' : '▼'}</span>
        </div>

        <p className="text-sm text-chartrons-olive-dark/80 mt-2">{acteur.description}</p>
        <PlaceMeta
          rating={acteur.rating}
          reviewsCount={acteur.reviewsCount}
          openingHours={acteur.openingHours}
          specialite={acteur.specialite}
        />
        <p className="text-xs text-chartrons-olive-dark/70 mt-2">📍 {acteur.adresse}</p>
        <DistanceBadge latitude={acteur.latitude} longitude={acteur.longitude} className="mt-1" />
        <div className="mt-2">
          <AccessibilityBadges source={acteur} />
        </div>
        <div className="mt-3" onClick={(event) => event.stopPropagation()}>
          <AudioReader
            text={[acteur.nomCommerce, acteur.specialite, acteur.description, acteur.adresse, acteur.telephone]
              .filter(Boolean)
              .join('. ')}
            className="w-full"
          />
        </div>
        <div className="mt-2 flex flex-col gap-1">
          <PhoneLink phone={acteur.telephone} />
          <EmailLink email={acteur.merchantEmail} />
        </div>
        {vip && <DailyMenuSection acteur={acteur} />}
        <MerchantSocialSection acteur={acteur} onUpdated={onUpdated} />
        <MerchantActionButtons acteur={acteur} />
        {!vip && onSubscribePro && (
          <div className="mt-3" onClick={(event) => event.stopPropagation()}>
            <Button type="button" variant="gold" className="w-full" onClick={onSubscribePro}>
              {t('acteurs.premiumPro.cta')}
            </Button>
          </div>
        )}
        <MerchantReviews merchantId={acteur.id} onSummaryChange={setReviewSummary} />
        <div className="mt-2 space-y-2" onClick={(event) => event.stopPropagation()}>
          <Button
            variant="ghost"
            size="md"
            className="w-full border border-chartrons-beige"
            onClick={onAskQuestion}
          >
            {t('contact.askQuestion')}
          </Button>
        </div>

        {isRestaurantCategory(acteur.categorie) && (
          <div className="mt-3" onClick={(event) => event.stopPropagation()}>
            <RestaurantMenu acteur={acteur} />
          </div>
        )}

        {vip && <VipOfferCard acteur={acteur} carnetPoints={carnetPoints} />}

        <AdminDeleteButton
          label={t('admin.deleteActeur')}
          confirmMessage={t('admin.deleteActeurConfirm', { name: acteur.nomCommerce })}
          onDelete={onDelete}
          className="mt-3"
        />

        {isExpanded && (
          <div className="mt-4 pt-4 border-t border-chartrons-gold/10 flex flex-col items-center gap-2">
            {hasQrVitrine(acteur) && acteur.qrCodeVitrine ? (
              <>
                <p className="text-xs font-medium text-chartrons-warm-gray">
                  {t('acteurs.qrVitrine')}
                </p>
                <QrCodeDisplay
                  value={acteur.qrCodeVitrine}
                  label={acteur.qrCodeVitrine}
                  size={140}
                />
                <p className="text-[10px] text-chartrons-warm-gray text-center">
                  {t('acteurs.qrHint')}
                </p>
              </>
            ) : (
              <>
                <p className="text-xs font-medium text-chartrons-warm-gray">
                  {t('acteurs.qrOptional')}
                </p>
                <p className="text-[10px] text-chartrons-warm-gray text-center">
                  {t('acteurs.qrOptionalHint')}
                </p>
                {canManageFidelite && (
                  <Button
                    type="button"
                    size="sm"
                    variant="gold"
                    disabled={generatingQrId === acteur.id}
                    onClick={(event) => {
                      event.stopPropagation();
                      onGenerateQr();
                    }}
                  >
                    {generatingQrId === acteur.id
                      ? t('common.loading')
                      : t('acteurs.generateQr')}
                  </Button>
                )}
              </>
            )}
            <Link
              to={`/pro?shop=${encodeURIComponent(acteur.id)}&tab=kit`}
              className="w-full"
              onClick={(event) => event.stopPropagation()}
            >
              <Button type="button" variant="secondary" size="sm" className="w-full">
                {t('proSpace.tabs.kit')}
              </Button>
            </Link>
          </div>
        )}
      </div>
    </Card>
  );
}
