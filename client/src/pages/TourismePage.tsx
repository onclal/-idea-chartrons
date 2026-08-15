import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { ActeurLocalCategory, LOCAL_RELAIS_ADDRESS, type ActeurLocal, type AgendaEvenement } from '@idea-chartrons/shared';
import { Badge, Button, Card, EmptyState, Loading } from '../components/ui';
import { PageHelp } from '../components/PageHelp';
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
        <Link to="/carte" className="mt-3 inline-flex">
          <Button size="sm" variant="bordeaux">
            {t('tourisme.openMap')}
          </Button>
        </Link>
      </Card>

      <section className="space-y-3">
        <h3 className="text-sm font-bold uppercase tracking-wide text-chartrons-olive">
          {t('tourisme.consignes.title')}
        </h3>
        <p className="text-sm text-chartrons-warm-gray leading-relaxed">{t('tourisme.consignes.hint')}</p>
        <Card className="!p-4">
          <p className="font-semibold text-chartrons-olive-dark">{t('map.pois.relaisTitle')}</p>
          <p className="text-xs text-chartrons-warm-gray mt-1">📍 {LOCAL_RELAIS_ADDRESS}</p>
          <p className="text-sm text-chartrons-warm-gray mt-2">{t('tourisme.consignes.relais')}</p>
          <Link to="/relais" className="mt-3 inline-flex text-sm font-semibold text-chartrons-bordeaux">
            {t('tourisme.consignes.relaisCta')} →
          </Link>
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
                <h4 className="font-semibold text-chartrons-olive-dark">{acteur.nomCommerce}</h4>
                <div className="mt-1.5">
                  <Badge variant="brass">{t(`acteurs.categories.${acteur.categorie}`)}</Badge>
                </div>
                <p className="text-sm text-chartrons-warm-gray mt-2">{acteur.description}</p>
                <p className="text-xs text-chartrons-warm-gray mt-2">📍 {acteur.adresse}</p>
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
              <h4 className="font-semibold text-chartrons-olive-dark">{event.titre}</h4>
              <p className="text-sm text-chartrons-warm-gray mt-1">{event.description}</p>
              {event.lieu && (
                <p className="text-xs text-chartrons-warm-gray mt-2">📍 {event.lieu}</p>
              )}
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
