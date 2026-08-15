import { lazy, Suspense, useCallback, useEffect, useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  ActeurLocalCategory,
  hasCoordinates,
  STATIC_MAP_POIS,
  type ActeurLocal,
  type AgendaEvenement,
} from '@idea-chartrons/shared';
import { Badge, Button, Card, Loading } from '../components/ui';
import { PageHelp } from '../components/PageHelp';
import { FavoriteButton } from '../components/FavoriteButton';
import { FavoritesDrawer } from '../components/FavoritesDrawer';
import type { MapPin, MapPinKind } from '../components/NeighborhoodMap';
import { useFavorites } from '../context/FavoritesContext';
import { useToast } from '../context/ToastContext';
import type { FavoriteInput } from '../lib/favorites';
import { api } from '../lib/api';

const NeighborhoodMap = lazy(() =>
  import('../components/NeighborhoodMap').then((mod) => ({ default: mod.NeighborhoodMap })),
);

type MapLayer = MapPinKind;

const LAYERS: MapLayer[] = ['commerce', 'sante', 'tourisme', 'relais', 'marche', 'event'];

function acteurKind(acteur: ActeurLocal): MapPinKind {
  if (acteur.categorie === ActeurLocalCategory.TourismeConciergerie) return 'tourisme';
  if (acteur.categorie === ActeurLocalCategory.SanteServices) return 'sante';
  return 'commerce';
}

function acteurHref(acteur: ActeurLocal): string {
  return acteur.categorie === ActeurLocalCategory.TourismeConciergerie ? '/tourisme' : '/acteurs';
}

function pinToFavorite(pin: MapPin): FavoriteInput {
  return {
    id: pin.id,
    kind: pin.kind,
    title: pin.title,
    subtitle: pin.subtitle,
    adresse: pin.adresse,
    latitude: pin.latitude,
    longitude: pin.longitude,
    href: pin.href ?? '/carte',
  };
}

export function MapPage() {
  const { t } = useTranslation();
  const { showToast } = useToast();
  const { favorites } = useFavorites();
  const [searchParams] = useSearchParams();
  const [acteurs, setActeurs] = useState<ActeurLocal[]>([]);
  const [events, setEvents] = useState<AgendaEvenement[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeLayers, setActiveLayers] = useState<Set<MapLayer>>(new Set(LAYERS));
  const [selectedId, setSelectedId] = useState<string | null>(searchParams.get('pin'));
  const [locateToken, setLocateToken] = useState(0);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const handleLocated = useCallback(() => showToast(t('map.located')), [showToast, t]);
  const handleLocateError = useCallback(() => showToast(t('map.locateError'), 'error'), [showToast, t]);

  useEffect(() => {
    Promise.all([api.getActeurs(), api.getEvents()])
      .then(([acteursData, eventsData]) => {
        setActeurs(acteursData);
        setEvents(eventsData);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const allPins = useMemo<MapPin[]>(() => {
    const fromActeurs: MapPin[] = acteurs.filter(hasCoordinates).map((acteur) => ({
      id: acteur.id,
      kind: acteurKind(acteur),
      title: acteur.nomCommerce,
      subtitle: t(`acteurs.categories.${acteur.categorie}`),
      adresse: acteur.adresse,
      latitude: acteur.latitude,
      longitude: acteur.longitude,
      href: acteurHref(acteur),
    }));

    const fromEvents: MapPin[] = events.filter(hasCoordinates).map((event) => ({
      id: event.id,
      kind: 'event',
      title: event.titre,
      subtitle: t(`events.types.${event.type}`),
      adresse: event.lieu ?? event.description,
      latitude: event.latitude,
      longitude: event.longitude,
      href: '/events',
    }));

    const fromPois: MapPin[] = STATIC_MAP_POIS.map((poi) => ({
      id: poi.id,
      kind: poi.kind,
      title: t(poi.titleKey),
      subtitle: t(poi.descriptionKey),
      adresse: poi.adresse,
      latitude: poi.latitude,
      longitude: poi.longitude,
      href: poi.href,
    }));

    return [...fromActeurs, ...fromEvents, ...fromPois];
  }, [acteurs, events, t]);

  const selected = allPins.find((pin) => pin.id === selectedId) ?? null;
  const visiblePins = useMemo(
    () => allPins.filter((pin) => activeLayers.has(pin.kind)),
    [allPins, activeLayers],
  );

  useEffect(() => {
    const pinId = searchParams.get('pin');
    if (!pinId) return;
    setSelectedId(pinId);
    const pin = allPins.find((item) => item.id === pinId);
    if (pin) {
      setActiveLayers((current) => new Set(current).add(pin.kind));
    }
  }, [searchParams, allPins]);

  const toggleLayer = (layer: MapLayer) => {
    setActiveLayers((current) => {
      const next = new Set(current);
      if (next.has(layer)) {
        if (next.size === 1) return next;
        next.delete(layer);
      } else {
        next.add(layer);
      }
      return next;
    });
  };

  if (loading) return <Loading message={t('common.loading')} />;

  return (
    <div className="space-y-4 animate-fade-in">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <h2 className="text-xl font-bold text-chartrons-bordeaux">{t('map.title')}</h2>
          <p className="text-sm text-chartrons-warm-gray mt-1">{t('map.subtitle')}</p>
        </div>
        <div className="flex items-center gap-1.5 shrink-0">
          <button
            type="button"
            onClick={() => setDrawerOpen(true)}
            className="relative touch-target w-11 h-11 rounded-full border border-chartrons-beige bg-white text-chartrons-bordeaux"
            aria-label={t('favorites.openDrawer')}
          >
            ♥
            {favorites.length > 0 && (
              <span className="absolute -top-1 -right-1 min-w-[1.15rem] h-[1.15rem] px-1 rounded-full bg-chartrons-bordeaux text-white text-[10px] font-bold flex items-center justify-center">
                {favorites.length}
              </span>
            )}
          </button>
          <PageHelp page="carte" />
        </div>
      </div>

      <div className="flex gap-2 overflow-x-auto pb-1 -mx-1 px-1">
        {LAYERS.map((layer) => {
          const on = activeLayers.has(layer);
          return (
            <button
              key={layer}
              type="button"
              onClick={() => toggleLayer(layer)}
              className={`shrink-0 touch-target px-3 py-2 rounded-full text-xs font-semibold border transition-all ${
                on
                  ? 'bg-chartrons-bordeaux text-white border-chartrons-bordeaux'
                  : 'bg-white text-chartrons-olive-dark border-chartrons-beige'
              }`}
            >
              {t(`map.layers.${layer}`)}
            </button>
          );
        })}
      </div>

      <div className="relative h-[55vh] min-h-[320px] rounded-2xl overflow-hidden border border-chartrons-beige shadow-card">
        <Suspense fallback={<Loading message={t('map.loading')} />}>
          <NeighborhoodMap
            pins={visiblePins}
            selectedId={selected?.id ?? null}
            onSelect={setSelectedId}
            locateToken={locateToken}
            onLocated={handleLocated}
            onLocateError={handleLocateError}
          />
        </Suspense>
        <Button
          type="button"
          size="sm"
          variant="bordeaux"
          className="absolute top-3 right-3 z-[400] shadow-card"
          onClick={() => setLocateToken((n) => n + 1)}
        >
          {t('map.locate')}
        </Button>
      </div>

      {selected ? (
        <Card className="!p-4">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <h3 className="font-semibold text-chartrons-olive-dark">{selected.title}</h3>
              <div className="mt-1.5">
                <Badge variant="olive">{selected.subtitle}</Badge>
              </div>
              <p className="text-xs text-chartrons-warm-gray mt-2">📍 {selected.adresse}</p>
            </div>
            <FavoriteButton place={pinToFavorite(selected)} />
          </div>
          {selected.href && (
            <Link
              to={selected.href}
              className="mt-3 inline-flex text-sm font-semibold text-chartrons-bordeaux"
            >
              {t('map.seeMore')} →
            </Link>
          )}
        </Card>
      ) : (
        <p className="text-xs text-chartrons-warm-gray text-center">{t('map.tapHint')}</p>
      )}

      <FavoritesDrawer open={drawerOpen} onClose={() => setDrawerOpen(false)} />
    </div>
  );
}
