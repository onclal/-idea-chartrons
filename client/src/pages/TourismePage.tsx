import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { ActeurLocalCategory, LOCAL_RELAIS_ADDRESS, STATIC_MAP_POIS, type ActeurLocal, type AgendaEvenement } from '@idea-chartrons/shared';
import { Badge, Button, Card, EmptyState, Loading } from '../components/ui';
import { PageHelp } from '../components/PageHelp';
import { FavoriteButton } from '../components/FavoriteButton';
import { DirectionsButton } from '../components/DirectionsButton';
import { ShareButton } from '../components/ShareButton';
import { appUrl, placeShareText } from '../lib/share';
import { api } from '../lib/api';

export function TourismePage() {
  const { t } = useTranslation();
  const [acteurs, setActeurs] = useState<ActeurLocal[]>([]);
  const [events, setEvents] = useState<AgendaEvenement[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([api.getActeurs(), api.getEvents()])
      .then(([acteursData, eventsData]) => {
        setActeurs(acteursData);
        setEvents(eventsData);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const conciergeries = useMemo(
    () => acteurs.filter((acteur) => acteur.categorie === ActeurLocalCategory.TourismeConciergerie),
    [acteurs],
  );

  const experiences = useMemo(
    () =>
      events
        .filter((event) => new Date(event.dateFin).getTime() >= Date.now())
        .sort((a, b) => new Date(a.dateDebut).getTime() - new Date(b.dateDebut).getTime())
        .slice(0, 4),
    [events],
  );

  const relaisPoi = STATIC_MAP_POIS.find((poi) => poi.id === 'poi-relais');

  if (loading) return <Loading message={t('common.loading')} />;

  return (
    <div className="space-y-5 animate-fade-in">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <h2 className="text-xl font-bold text-chartrons-bordeaux">{t('tourisme.title')}</h2>
          <p className="text-sm text-chartrons-warm-gray mt-1">{t('tourisme.subtitle')}</p>
        </div>
        <PageHelp page="tourisme" />
      </div>

      <Card className="!p-4 bg-gradient-to-br from-chartrons-beige/70 to-white">
        <p className="text-sm text-chartrons-olive-dark leading-relaxed">{t('tourisme.intro')}</p>
        <div className="flex flex-wrap gap-2 mt-3">
          <Link to="/carte">
            <Button size="sm" variant="bordeaux">
              {t('tourisme.openMap')}
            </Button>
          </Link>
          <Link to="/carte?favoris=1">
            <Button size="sm" variant="secondary">
              {t('favorites.seeLayer')}
            </Button>
          </Link>
        </div>
      </Card>

      <section className="space-y-3">
        <h3 className="text-sm font-bold uppercase tracking-wide text-chartrons-olive">
          {t('tourisme.consignes.title')}
        </h3>
        <p className="text-sm text-chartrons-warm-gray leading-relaxed">{t('tourisme.consignes.hint')}</p>
        <Card className="!p-4">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <p className="font-semibold text-chartrons-olive-dark">{t('map.pois.relaisTitle')}</p>
              <p className="text-xs text-chartrons-warm-gray mt-1">📍 {LOCAL_RELAIS_ADDRESS}</p>
            </div>
            {relaisPoi && (
              <FavoriteButton
                place={{
                  id: relaisPoi.id,
                  kind: 'relais',
                  title: t('map.pois.relaisTitle'),
                  subtitle: t('map.pois.relaisHint'),
                  adresse: LOCAL_RELAIS_ADDRESS,
                  latitude: relaisPoi.latitude,
                  longitude: relaisPoi.longitude,
                  href: '/relais',
                }}
              />
            )}
          </div>
          <p className="text-sm text-chartrons-warm-gray mt-2">{t('tourisme.consignes.relais')}</p>
          <div className="flex flex-wrap gap-2 mt-3">
            {relaisPoi && (
              <DirectionsButton latitude={relaisPoi.latitude} longitude={relaisPoi.longitude} />
            )}
            <ShareButton
              title={t('map.pois.relaisTitle')}
              text={placeShareText({ title: t('map.pois.relaisTitle'), adresse: LOCAL_RELAIS_ADDRESS })}
              url={appUrl('/carte?pin=poi-relais')}
            />
            <Link to="/relais" className="flex-1">
              <Button type="button" size="sm" variant="secondary" className="w-full">
                {t('tourisme.consignes.relaisCta')}
              </Button>
            </Link>
          </div>
        </Card>
      </section>

      <section className="space-y-3">
        <h3 className="text-sm font-bold uppercase tracking-wide text-chartrons-olive">
          {t('tourisme.adresses.title')}
        </h3>
        <p className="text-sm text-chartrons-warm-gray leading-relaxed">{t('tourisme.adresses.hint')}</p>
        {conciergeries.length === 0 ? (
          <EmptyState icon="🧳" message={t('tourisme.adresses.empty')} />
        ) : (
          conciergeries.map((acteur) => (
            <Card key={acteur.id} className="!p-0 overflow-hidden">
              {acteur.photos[0] && (
                <img src={acteur.photos[0]} alt="" className="w-full h-36 object-cover" />
              )}
              <div className="p-4">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <h4 className="font-semibold text-chartrons-olive-dark">{acteur.nomCommerce}</h4>
                    <div className="mt-1.5">
                      <Badge variant="brass">{t(`acteurs.categories.${acteur.categorie}`)}</Badge>
                    </div>
                  </div>
                  <FavoriteButton
                    place={{
                      id: acteur.id,
                      kind: 'tourisme',
                      title: acteur.nomCommerce,
                      subtitle: t(`acteurs.categories.${acteur.categorie}`),
                      adresse: acteur.adresse,
                      latitude: acteur.latitude,
                      longitude: acteur.longitude,
                      href: '/tourisme',
                    }}
                  />
                </div>
                <p className="text-sm text-chartrons-warm-gray mt-2">{acteur.description}</p>
                <p className="text-xs text-chartrons-warm-gray mt-2">📍 {acteur.adresse}</p>
                <div className="flex flex-wrap gap-2 mt-3">
                  {acteur.latitude != null && acteur.longitude != null && (
                    <DirectionsButton latitude={acteur.latitude} longitude={acteur.longitude} />
                  )}
                  <ShareButton
                    title={acteur.nomCommerce}
                    text={placeShareText({ title: acteur.nomCommerce, adresse: acteur.adresse })}
                    url={appUrl(`/carte?pin=${encodeURIComponent(acteur.id)}`)}
                  />
                </div>
              </div>
            </Card>
          ))
        )}
      </section>

      <section className="space-y-3">
        <h3 className="text-sm font-bold uppercase tracking-wide text-chartrons-olive">
          {t('tourisme.experiences.title')}
        </h3>
        <p className="text-sm text-chartrons-warm-gray leading-relaxed">{t('tourisme.experiences.hint')}</p>
        {experiences.length === 0 ? (
          <EmptyState icon="📅" message={t('tourisme.experiences.empty')} />
        ) : (
          experiences.map((event) => (
            <Card key={event.id} className="!p-4">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <h4 className="font-semibold text-chartrons-olive-dark">{event.titre}</h4>
                  <p className="text-sm text-chartrons-warm-gray mt-1">{event.description}</p>
                  {event.lieu && (
                    <p className="text-xs text-chartrons-warm-gray mt-2">📍 {event.lieu}</p>
                  )}
                </div>
                <FavoriteButton
                  place={{
                    id: event.id,
                    kind: 'event',
                    title: event.titre,
                    subtitle: t(`events.types.${event.type}`),
                    adresse: event.lieu ?? event.description,
                    latitude: event.latitude,
                    longitude: event.longitude,
                    href: '/events',
                  }}
                />
              </div>
              <div className="flex flex-wrap gap-2 mt-3">
                {event.latitude != null && event.longitude != null && (
                  <DirectionsButton latitude={event.latitude} longitude={event.longitude} />
                )}
                <ShareButton
                  title={event.titre}
                  text={placeShareText({
                    title: event.titre,
                    adresse: event.lieu ?? event.description,
                  })}
                  url={appUrl(`/carte?pin=${encodeURIComponent(event.id)}`)}
                />
              </div>
            </Card>
          ))
        )}
        <Link to="/events" className="inline-flex text-sm font-semibold text-chartrons-bordeaux">
          {t('tourisme.experiences.cta')} →
        </Link>
      </section>
    </div>
  );
}
