import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  formatDistanceMeters,
  type BudgetUnit,
  type ConciergeLang,
  type ConciergeRationale,
  type ConciergeRecommendation,
  type StreetHeritage,
} from '@idea-chartrons/shared';
import { Badge, Card } from './ui';
import { ConciergeOrderModal } from './ConciergeOrderModal';
import {
  canPlaceConciergeOrder,
  conciergeSmsHref,
  conciergeWalkingRouteUrl,
  conciergeWhatsAppHref,
  formatConciergeBudget,
  orderLinesFromRecommendation,
  orderShopFromRecommendation,
} from '../lib/concierge';
import { walkingDirectionsUrl } from '../lib/itinerary';
import { AudioReader } from './AudioReader';
import { AccessibilityBadges } from './AccessibilityBadges';
import { DistanceBadge } from './DistanceBadge';

interface ConciergeRichResultsProps {
  recommendations: ConciergeRecommendation[];
  heritage: StreetHeritage[];
  lang: ConciergeLang;
  compact?: boolean;
}

export function ConciergeRichResults({
  recommendations,
  heritage,
  lang,
  compact = false,
}: ConciergeRichResultsProps) {
  const { t, i18n } = useTranslation();
  const uiLang = i18n.language;
  const routeUrl = conciergeWalkingRouteUrl(recommendations);
  const [orderItem, setOrderItem] = useState<ConciergeRecommendation | null>(null);

  const unitLabel = (unit: BudgetUnit) => t(`conciergerie.ai.units.${unit}`);
  const rationaleLabel = (rationale: ConciergeRationale) => {
    if (
      rationale.kind === 'keyword' ||
      rationale.kind === 'intent' ||
      rationale.kind === 'street' ||
      rationale.kind === 'qualification' ||
      rationale.kind === 'catalog'
    ) {
      return t(`conciergerie.ai.rationale.${rationale.kind}`, { value: rationale.value ?? '' });
    }
    if (rationale.kind === 'rating') {
      return t('conciergerie.ai.rationale.rating', { value: rationale.value ?? '' });
    }
    return t(`conciergerie.ai.rationale.${rationale.kind}`);
  };

  return (
    <div className="space-y-3">
      {recommendations.length > 0 && (
        <section className="space-y-3">
          <div className="flex items-center justify-between gap-2">
            <h4 className="text-sm font-bold text-chartrons-bordeaux">
              {t('conciergerie.ai.topTitle', { count: recommendations.length })}
            </h4>
            {routeUrl && (
              <a
                href={routeUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs font-semibold text-chartrons-bordeaux hover:underline"
              >
                🚶 {t('conciergerie.ai.routeAll')}
              </a>
            )}
          </div>
          {recommendations.map((item, index) => (
            <ConciergeRecommendationCard
              key={item.poiId}
              rank={index + 1}
              item={item}
              lang={lang}
              compact={compact}
              unitLabel={unitLabel}
              rationaleLabel={rationaleLabel}
              onOrder={() => setOrderItem(item)}
            />
          ))}
        </section>
      )}

      {heritage.length > 0 && (
        <section className="space-y-3">
          <h4 className="text-sm font-bold text-chartrons-bordeaux">{t('conciergerie.ai.heritageTitle')}</h4>
          {heritage.map((street) => (
            <Card key={street.id} className="!p-3 space-y-2 bg-gradient-to-br from-chartrons-brass/12 to-white">
              <div className="flex items-center justify-between gap-2">
                <p className="font-semibold text-chartrons-olive-dark text-sm">{street.street}</p>
                <Badge variant="brass">{street.era}</Badge>
              </div>
              <p className="text-xs text-chartrons-warm-gray leading-relaxed">
                {uiLang.startsWith('en') ? street.summary.en : street.summary.fr}
              </p>
              <a
                href={walkingDirectionsUrl({
                  latitude: street.coordinates.lat,
                  longitude: street.coordinates.lng,
                })}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center min-h-[40px] px-3 rounded-xl bg-white border border-chartrons-beige text-xs font-semibold text-chartrons-olive-dark hover:bg-chartrons-stone"
              >
                🚶 {t('conciergerie.ai.routeStreet')}
              </a>
            </Card>
          ))}
        </section>
      )}

      <ConciergeOrderModal
        open={Boolean(orderItem)}
        shop={orderItem ? orderShopFromRecommendation(orderItem) : null}
        lines={orderItem ? orderLinesFromRecommendation(orderItem) : []}
        onClose={() => setOrderItem(null)}
      />
    </div>
  );
}

interface RecommendationCardProps {
  rank: number;
  item: ConciergeRecommendation;
  lang: ConciergeLang;
  compact: boolean;
  unitLabel: (unit: BudgetUnit) => string;
  rationaleLabel: (rationale: ConciergeRationale) => string;
  onOrder: () => void;
}

function ConciergeRecommendationCard({
  rank,
  item,
  lang,
  compact,
  unitLabel,
  rationaleLabel,
  onOrder,
}: RecommendationCardProps) {
  const { t, i18n } = useTranslation();
  const budget = formatConciergeBudget(item.budget, unitLabel);
  const whatsapp = conciergeWhatsAppHref(item, lang);
  const sms = conciergeSmsHref(item, lang);
  const directions = walkingDirectionsUrl({
    latitude: item.coordinates.lat,
    longitude: item.coordinates.lng,
  });

  return (
    <Card className="!p-3 space-y-2.5">
      <div className="flex items-start gap-3">
        <span className="shrink-0 w-8 h-8 rounded-full bg-chartrons-green text-white text-sm font-bold flex items-center justify-center">
          {rank}
        </span>
        <div className="min-w-0 flex-1">
          <p className="font-semibold text-chartrons-olive-dark leading-snug">{item.name}</p>
          <p className="text-xs text-chartrons-warm-gray mt-0.5">{item.specialty}</p>
          {item.justification && (
            <p className="text-xs text-chartrons-green-dark mt-1 leading-snug">{item.justification}</p>
          )}
          <p className="text-xs text-chartrons-warm-gray mt-1">📍 {item.address}</p>
          {typeof item.distanceMeters === 'number' ? (
            <p className="text-xs font-semibold text-chartrons-green mt-1">
              📍 {formatDistanceMeters(item.distanceMeters, i18n.language)}
            </p>
          ) : (
            <DistanceBadge latitude={item.coordinates.lat} longitude={item.coordinates.lng} className="mt-1" />
          )}
          {item.withinRadius === false && (
            <p className="text-[11px] text-chartrons-brass mt-0.5">{t('conciergerie.ai.outsideRadius')}</p>
          )}
          <div className="mt-2">
            <AccessibilityBadges
              source={{
                hasDelivery: item.hasDelivery,
                wheelchairAccessible: item.wheelchairAccessible,
                seniorFriendly: item.seniorFriendly,
                accessible: item.accessible,
              }}
            />
          </div>
          <div className="mt-2">
            <AudioReader
              text={[item.name, item.specialty, item.justification, item.address, item.phone]
                .filter(Boolean)
                .join('. ')}
              className="w-full"
            />
          </div>
          {item.openNow === true && (
            <p className="text-[11px] font-semibold text-chartrons-green mt-1">{t('conciergerie.ai.openNow')}</p>
          )}
          {item.openNow === false && (
            <p className="text-[11px] text-chartrons-warm-gray mt-1">{t('conciergerie.ai.closedNow')}</p>
          )}
        </div>
        {item.rating != null && (
          <Badge variant="gold" icon="★">
            {item.rating.toFixed(1)}
          </Badge>
        )}
      </div>

      {!compact && (
        <div className="flex flex-wrap gap-1.5">
          {item.rationale.map((rationale, index) => (
            <Badge key={`${rationale.kind}-${index}`} variant="stone">
              {rationaleLabel(rationale)}
            </Badge>
          ))}
        </div>
      )}

      {budget && (
        <p className="text-sm font-semibold text-chartrons-bordeaux">
          💶 {t('conciergerie.ai.budget')} : {budget}
        </p>
      )}
      {item.websiteGated && (
        <p className="text-xs text-chartrons-warm-gray leading-relaxed">{t('conciergerie.ai.websiteGated')}</p>
      )}
      {(item.email || item.instagram) && (
        <p className="text-xs text-chartrons-olive-dark">
          {item.email ? `✉️ ${item.email}` : ''}
          {item.email && item.instagram ? ' · ' : ''}
          {item.instagram ? (
            <a href={item.instagram} target="_blank" rel="noopener noreferrer" className="font-semibold text-chartrons-bordeaux">
              Instagram
            </a>
          ) : null}
        </p>
      )}

      <div className="flex flex-wrap gap-2">
        {item.website && (
          <a
            href={item.website}
            target="_blank"
            rel="noopener noreferrer"
            className="flex-1 min-w-[110px] inline-flex items-center justify-center min-h-[40px] px-3 rounded-xl bg-chartrons-brass text-chartrons-olive-dark text-xs font-semibold"
          >
            {t('acteurs.social.website')}
          </a>
        )}
        {item.action === 'book_table' && (
          <span className="flex-1 min-w-[110px] inline-flex items-center justify-center min-h-[40px] px-3 rounded-xl bg-chartrons-bordeaux text-white text-xs font-semibold">
            {t('conciergerie.ai.actionTable')}
          </span>
        )}
        {item.action === 'book_appointment' && (
          <span className="flex-1 min-w-[110px] inline-flex items-center justify-center min-h-[40px] px-3 rounded-xl bg-chartrons-bordeaux text-white text-xs font-semibold">
            {t('conciergerie.ai.actionAppointment')}
          </span>
        )}
        {canPlaceConciergeOrder(item) && (
          <button
            type="button"
            onClick={onOrder}
            className="flex-1 min-w-[110px] inline-flex items-center justify-center min-h-[40px] px-3 rounded-xl bg-chartrons-green text-white text-xs font-semibold"
          >
            {t('conciergerie.order.cta')}
          </button>
        )}
        {whatsapp && (
          <a
            href={whatsapp}
            target="_blank"
            rel="noopener noreferrer"
            className="flex-1 min-w-[110px] inline-flex items-center justify-center min-h-[40px] px-3 rounded-xl bg-chartrons-green text-white text-xs font-semibold"
          >
            {t('conciergerie.ai.orderWhatsapp')}
          </a>
        )}
        {sms && (
          <a
            href={sms}
            className="flex-1 min-w-[110px] inline-flex items-center justify-center min-h-[40px] px-3 rounded-xl bg-white border border-chartrons-beige text-xs font-semibold text-chartrons-olive-dark"
          >
            {t('conciergerie.ai.orderSms')}
          </a>
        )}
        <a
          href={directions}
          target="_blank"
          rel="noopener noreferrer"
          className="flex-1 min-w-[110px] inline-flex items-center justify-center min-h-[40px] px-3 rounded-xl bg-white border border-chartrons-beige text-xs font-semibold text-chartrons-olive-dark"
        >
          🚶 {t('conciergerie.ai.route')}
        </a>
      </div>
    </Card>
  );
}
