import { lazy, Suspense, useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  hasCoordinates,
  isFleaMarketEvent,
  isNotreDameCertifiedDealer,
  isPremiumProMerchant,
  publicPepites,
  antiqueDealersFromDirectory,
  type ActeurLocal,
  type AgendaEvenement,
  type AntiqueItem,
} from '@idea-chartrons/shared';
import { Badge, Button, Card, EmptyState, Loading } from '../components/ui';
import { PageHelp } from '../components/PageHelp';
import { DistanceBadge } from '../components/DistanceBadge';
import { PhoneLink } from '../components/PhoneLink';
import { PlaceCover } from '../components/PlaceCover';
import { resolveMediaUrl } from '../lib/media';
import { api } from '../lib/api';
import { useConciergePanel } from '../context/ConciergePanelContext';
import type { MapPin } from '../components/NeighborhoodMap';

const NeighborhoodMap = lazy(() =>
  import('../components/NeighborhoodMap').then((mod) => ({ default: mod.NeighborhoodMap })),
);

function formatDate(dateStr: string, locale: string) {
  return new Date(dateStr).toLocaleDateString(locale === 'fr' ? 'fr-FR' : 'en-GB', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function BrocanteursPage() {
  const { t, i18n } = useTranslation();
  const { ask, pending } = useConciergePanel();
  const [acteurs, setActeurs] = useState<ActeurLocal[]>([]);
  const [items, setItems] = useState<AntiqueItem[]>([]);
  const [events, setEvents] = useState<AgendaEvenement[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  useEffect(() => {
    Promise.all([api.getActeurs(), api.getAntiqueItems(), api.getEvents()])
      .then(([acteursData, itemsData, eventsData]) => {
        setActeurs(acteursData);
        setItems(itemsData);
        setEvents(eventsData);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const dealers = useMemo(() => {
    const list = antiqueDealersFromDirectory(acteurs);
    return [...list].sort((a, b) => {
      const premium = Number(isPremiumProMerchant(b)) - Number(isPremiumProMerchant(a));
      if (premium !== 0) return premium;
      return a.nomCommerce.localeCompare(b.nomCommerce, 'fr');
    });
  }, [acteurs]);

  const pepites = useMemo(() => publicPepites(items, acteurs), [items, acteurs]);
  const schedule = useMemo(
    () =>
      events
        .filter(isFleaMarketEvent)
        .sort((a, b) => new Date(a.dateDebut).getTime() - new Date(b.dateDebut).getTime()),
    [events],
  );

  const pins: MapPin[] = useMemo(
    () =>
      dealers.filter(hasCoordinates).map((dealer) => ({
        id: dealer.id,
        kind: 'commerce' as const,
        title: dealer.nomCommerce,
        subtitle: dealer.specialite ?? t('brocanteurs.specialtyFallback'),
        adresse: dealer.adresse,
        latitude: dealer.latitude as number,
        longitude: dealer.longitude as number,
        href: `/acteurs?fiche=${encodeURIComponent(dealer.id)}`,
        telephone: dealer.telephone,
        imageUrl: dealer.photos[0],
        rating: dealer.rating,
        reviewsCount: dealer.reviewsCount,
        openingHours: dealer.openingHours,
        specialite: dealer.specialite,
      })),
    [dealers, t],
  );

  const chips = [
    t('brocanteurs.suggestions.style'),
    t('brocanteurs.suggestions.era'),
    t('brocanteurs.suggestions.walk'),
  ];

  if (loading) return <Loading message={t('common.loading')} />;

  const merchantName = (merchantId: string) =>
    acteurs.find((acteur) => acteur.id === merchantId)?.nomCommerce ?? t('brocanteurs.unknownShop');

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold text-chartrons-bordeaux">{t('brocanteurs.title')}</h2>
          <p className="text-sm text-chartrons-warm-gray mt-1">{t('brocanteurs.subtitle')}</p>
        </div>
        <PageHelp page="brocanteurs" />
      </div>

      <Card className="!p-4 bg-chartrons-stone/60">
        <p className="text-sm font-semibold text-chartrons-olive-dark">{t('brocanteurs.chineurHint')}</p>
        <div className="mt-3 flex flex-wrap gap-1.5">
          {chips.map((chip) => (
            <button
              key={chip}
              type="button"
              disabled={pending}
              onClick={() => void ask(chip)}
              className="px-3 py-1.5 rounded-full text-[11px] font-semibold border border-chartrons-beige bg-white text-chartrons-olive-dark touch-target disabled:opacity-50"
            >
              {chip}
            </button>
          ))}
        </div>
      </Card>

      <section className="space-y-3">
        <h3 className="text-sm font-bold uppercase tracking-wide text-chartrons-olive">
          {t('brocanteurs.scheduleTitle')}
        </h3>
        {schedule.length === 0 ? (
          <EmptyState icon="🎪" title={t('brocanteurs.scheduleEmpty')} message={t('brocanteurs.scheduleEmptyHint')} />
        ) : (
          <div className="space-y-3">
            {schedule.map((event) => {
              const upcoming = new Date(event.dateFin).getTime() >= Date.now();
              return (
                <Card key={event.id} className={`!p-0 overflow-hidden ${upcoming ? '' : 'opacity-60'}`}>
                  {event.image && <img src={event.image} alt="" className="w-full h-32 object-cover" />}
                  <div className="p-4">
                    <div className="flex items-start justify-between gap-2">
                      <h4 className="font-semibold text-chartrons-olive-dark">{event.titre}</h4>
                      <Badge variant="brocante">{t(`events.types.${event.type}`)}</Badge>
                    </div>
                    <p className="text-sm text-chartrons-warm-gray mt-1 leading-relaxed">{event.description}</p>
                    {event.lieu && <p className="text-xs text-chartrons-warm-gray mt-2">📍 {event.lieu}</p>}
                    <p className="text-xs font-semibold text-chartrons-bordeaux mt-2">
                      🕐 {formatDate(event.dateDebut, i18n.language)}
                    </p>
                  </div>
                </Card>
              );
            })}
          </div>
        )}
      </section>

      <section className="space-y-3">
        <h3 className="text-sm font-bold uppercase tracking-wide text-chartrons-olive">
          {t('brocanteurs.mapTitle')}
        </h3>
        <div className="h-72 rounded-2xl overflow-hidden shadow-card">
          <Suspense fallback={<Loading message={t('common.loading')} />}>
            <NeighborhoodMap
              pins={pins}
              selectedId={selectedId}
              onSelect={setSelectedId}
              locateToken={0}
              onLocated={() => undefined}
              onLocateError={() => undefined}
            />
          </Suspense>
        </div>
      </section>

      <section className="space-y-3">
        <h3 className="text-sm font-bold uppercase tracking-wide text-chartrons-olive">
          {t('brocanteurs.directoryTitle')}
        </h3>
        {dealers.length === 0 ? (
          <EmptyState icon="🏺" title={t('brocanteurs.directoryEmpty')} message={t('brocanteurs.directoryEmptyHint')} />
        ) : (
          <div className="space-y-3">
            {dealers.map((dealer) => {
              const certified = isNotreDameCertifiedDealer(dealer);
              const premium = isPremiumProMerchant(dealer);
              const cover = resolveMediaUrl(dealer.photos[0]);
              return (
                <Link key={dealer.id} to={`/acteurs?fiche=${encodeURIComponent(dealer.id)}`}>
                  <Card className="!p-0 overflow-hidden hover:shadow-card-hover">
                    {cover && <PlaceCover src={cover} />}
                    <div className="p-4">
                      <h4 className="font-semibold text-chartrons-olive-dark">{dealer.nomCommerce}</h4>
                      <div className="flex flex-wrap gap-1.5 mt-1.5">
                        {dealer.specialite && <Badge variant="olive">{dealer.specialite}</Badge>}
                        {certified ? (
                          <Badge variant="vip" icon="✦">{t('brocanteurs.certifiedBadge')}</Badge>
                        ) : premium ? (
                          <Badge variant="vip" icon="⭐">{t('badges.premiumPro')}</Badge>
                        ) : (
                          <Badge variant="stone">{t('brocanteurs.freeTier')}</Badge>
                        )}
                      </div>
                      <p className="text-sm text-chartrons-olive-dark/80 mt-2 line-clamp-2">{dealer.description}</p>
                      <p className="text-xs text-chartrons-olive-dark/70 mt-2">📍 {dealer.adresse}</p>
                      <DistanceBadge latitude={dealer.latitude} longitude={dealer.longitude} className="mt-1" />
                      <div className="mt-2" onClick={(event) => event.stopPropagation()}>
                        <PhoneLink phone={dealer.telephone} />
                      </div>
                    </div>
                  </Card>
                </Link>
              );
            })}
          </div>
        )}
      </section>

      <section className="space-y-3">
        <div>
          <h3 className="text-sm font-bold uppercase tracking-wide text-chartrons-olive">
            {t('brocanteurs.pepitesTitle')}
          </h3>
          <p className="text-xs text-chartrons-warm-gray mt-1">{t('brocanteurs.pepitesHint')}</p>
        </div>
        {pepites.length === 0 ? (
          <EmptyState icon="✨" title={t('brocanteurs.pepitesEmpty')} message={t('brocanteurs.pepitesEmptyHint')} />
        ) : (
          <div className="grid grid-cols-1 gap-3">
            {pepites.map((item) => {
              const sold = item.status === 'sold';
              return (
                <Card key={item.id} className={`!p-0 overflow-hidden ${sold ? 'opacity-70' : ''}`}>
                  {item.photoUrl && (
                    <div className="relative">
                      <img src={item.photoUrl} alt="" className="w-full h-40 object-cover" />
                      {sold && (
                        <div className="absolute inset-0 bg-chartrons-olive-dark/45 flex items-center justify-center">
                          <Badge variant="stone">{t('brocanteurs.sold')}</Badge>
                        </div>
                      )}
                    </div>
                  )}
                  <div className="p-4">
                    <div className="flex items-start justify-between gap-2">
                      <h4 className="font-semibold text-chartrons-olive-dark">{item.title}</h4>
                      <Badge variant={sold ? 'stone' : 'brass'}>
                        {sold ? t('brocanteurs.sold') : t('brocanteurs.active')}
                      </Badge>
                    </div>
                    <p className="text-xs text-chartrons-brass font-semibold mt-1">
                      {item.style} · {item.era}
                    </p>
                    <p className="text-sm text-chartrons-warm-gray mt-1 leading-relaxed">{item.description}</p>
                    <Link
                      to={`/acteurs?fiche=${encodeURIComponent(item.merchantId)}`}
                      className="mt-2 inline-block text-xs font-semibold text-chartrons-bordeaux hover:underline"
                    >
                      {merchantName(item.merchantId)}
                    </Link>
                    {!sold && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="mt-3 w-full border border-chartrons-beige"
                        disabled={pending}
                        onClick={() => void ask(`${item.title} ${item.style}`)}
                      >
                        {t('brocanteurs.askChineur')}
                      </Button>
                    )}
                  </div>
                </Card>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}
