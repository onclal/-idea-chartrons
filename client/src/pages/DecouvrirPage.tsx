import { useMemo, type ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { Badge, Card } from '../components/ui';
import { PageHelp } from '../components/PageHelp';
import { DirectionsButton } from '../components/DirectionsButton';
import {
  CHARTRONS_WALKS,
  HERITAGE_SPOTS,
  INSTAGRAM_SPOTS,
  MOBILITY_PLACES,
} from '../data/decouvrir';
import { loc } from '../lib/locale';

function Section({
  id,
  index,
  title,
  hint,
  children,
}: {
  id: string;
  index: number;
  title: string;
  hint: string;
  children: ReactNode;
}) {
  return (
    <section id={id} className="space-y-3">
      <div>
        <p className="text-[11px] font-bold uppercase tracking-wider text-chartrons-brass">
          {index < 10 ? `0${index}` : index}
        </p>
        <h3 className="text-lg font-bold text-chartrons-bordeaux">{title}</h3>
        <p className="text-sm text-chartrons-warm-gray mt-1 leading-relaxed">{hint}</p>
      </div>
      {children}
    </section>
  );
}

export function DecouvrirPage() {
  const { t, i18n } = useTranslation();
  const lang = i18n.language;

  const mobilityGroups = useMemo(
    () =>
      [
        { kind: 'vcub' as const, icon: '🚲', title: t('decouvrir.mobility.vcub') },
        { kind: 'piste' as const, icon: '🛣️', title: t('decouvrir.mobility.lanes') },
        { kind: 'reparation' as const, icon: '🔧', title: t('decouvrir.mobility.repair') },
      ].map((group) => ({
        ...group,
        places: MOBILITY_PLACES.filter((place) => place.kind === group.kind),
      })),
    [t],
  );

  return (
    <div className="space-y-8 animate-fade-in">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <h2 className="text-xl font-bold text-chartrons-bordeaux">{t('decouvrir.title')}</h2>
          <p className="text-sm text-chartrons-warm-gray mt-1">{t('decouvrir.subtitle')}</p>
        </div>
        <PageHelp page="decouvrir" />
      </div>

      <Card className="!p-4 bg-gradient-to-br from-chartrons-beige/70 to-white">
        <p className="text-sm text-chartrons-olive-dark leading-relaxed">{t('decouvrir.intro')}</p>
      </Card>

      <Section id="parcours" index={1} title={t('decouvrir.walks.title')} hint={t('decouvrir.walks.hint')}>
        {CHARTRONS_WALKS.map((walk) => (
          <Card key={walk.id} className="!p-4 space-y-3">
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <p className="font-semibold text-chartrons-olive-dark">
                  <span aria-hidden>{walk.icon} </span>
                  {loc(lang, walk.title)}
                </p>
                <p className="text-sm text-chartrons-warm-gray mt-1">{loc(lang, walk.summary)}</p>
              </div>
              <Badge variant="brass">{loc(lang, walk.duration)}</Badge>
            </div>
            <ol className="space-y-1.5">
              {walk.stops.map((stop, index) => (
                <li key={`${walk.id}-${index}`} className="flex gap-2 text-sm text-chartrons-olive-dark">
                  <span className="shrink-0 w-6 h-6 rounded-full bg-chartrons-bordeaux text-white text-[11px] font-bold flex items-center justify-center">
                    {index + 1}
                  </span>
                  <span className="pt-0.5">{loc(lang, stop.name)}</span>
                </li>
              ))}
            </ol>
            <DirectionsButton stops={walk.stops} label={t('decouvrir.walks.go')} />
          </Card>
        ))}
      </Section>

      <Section
        id="incontournables"
        index={2}
        title={t('decouvrir.heritage.title')}
        hint={t('decouvrir.heritage.hint')}
      >
        {HERITAGE_SPOTS.map((spot) => (
          <Card key={spot.id} className="!p-4 space-y-2">
            <p className="font-semibold text-chartrons-olive-dark">
              <span aria-hidden>{spot.icon} </span>
              {loc(lang, spot.title)}
            </p>
            <p className="text-sm text-chartrons-warm-gray leading-relaxed">{loc(lang, spot.summary)}</p>
            <p className="text-xs text-chartrons-warm-gray">📍 {spot.adresse}</p>
            <DirectionsButton latitude={spot.latitude} longitude={spot.longitude} />
          </Card>
        ))}
      </Section>

      <Section id="spots" index={3} title={t('decouvrir.spots.title')} hint={t('decouvrir.spots.hint')}>
        {INSTAGRAM_SPOTS.map((spot) => (
          <Card key={spot.id} className="!p-4 space-y-2">
            <p className="font-semibold text-chartrons-olive-dark">
              <span aria-hidden>{spot.icon} </span>
              {loc(lang, spot.title)}
            </p>
            <p className="text-sm text-chartrons-olive-dark leading-relaxed">{loc(lang, spot.anecdote)}</p>
            <DirectionsButton latitude={spot.latitude} longitude={spot.longitude} />
          </Card>
        ))}
      </Section>

      <Section id="mobilite" index={4} title={t('decouvrir.mobility.title')} hint={t('decouvrir.mobility.hint')}>
        {mobilityGroups.map((group) => (
          <div key={group.kind} className="space-y-2">
            <p className="text-xs font-bold uppercase tracking-wide text-chartrons-warm-gray">
              {group.icon} {group.title}
            </p>
            {group.places.map((place) => (
              <Card key={place.id} className="!p-4 space-y-2">
                <p className="font-semibold text-chartrons-olive-dark">{loc(lang, place.title)}</p>
                <p className="text-sm text-chartrons-warm-gray">{loc(lang, place.hint)}</p>
                <p className="text-xs text-chartrons-warm-gray">📍 {place.adresse}</p>
                <DirectionsButton latitude={place.latitude} longitude={place.longitude} />
              </Card>
            ))}
          </div>
        ))}
        <a
          href="https://www.infotbm.com/fr/velo"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center justify-center gap-2 w-full min-h-[44px] px-4 py-3 rounded-xl bg-white text-chartrons-olive-dark border border-chartrons-beige text-sm font-medium shadow-sm hover:bg-chartrons-stone"
        >
          {t('decouvrir.mobility.vcubLink')}
        </a>
      </Section>
    </div>
  );
}
