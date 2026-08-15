import { lazy, Suspense, useCallback, useEffect, useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  ActeurLocalCategory,
  CHARTRONS_MAP_CENTER,
  hasCoordinates,
  STATIC_MAP_POIS,
  type ActeurLocal,
  type AgendaEvenement,
} from '@idea-chartrons/shared';
import { Badge, Button, Card, Loading } from '../components/ui';
import { PageHelp } from '../components/PageHelp';
import { FavoriteButton } from '../components/FavoriteButton';
import { FavoritesDrawer } from '../components/FavoritesDrawer';
import { DirectionsButton } from '../components/DirectionsButton';
import { ShareButton } from '../components/ShareButton';
import type { MapPin, MapPinKind } from '../components/NeighborhoodMap';
import { useFavorites } from '../context/FavoritesContext';
import { useToast } from '../context/ToastContext';
import type { FavoriteInput, FavoritePlace } from '../lib/favorites';
import { formatDistance, itineraryDistanceKm, orderItinerary } from '../lib/itinerary';
import { appUrl, listShareText, placeShareText } from '../lib/share';
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

function favoriteToPin(place: FavoritePlace & { latitude: number; longitude: number }): MapPin {
  return {
    id: place.id,
    kind: place.kind,
    title: place.title,
    subtitle: place.subtitle,
    adresse: place.adresse,
    latitude: place.latitude,
    longitude: place.longitude,
    href: place.href,
  };
}

export function MapPage() {
  const { t, i18n } = useTranslation();
  const { showToast } = useToast();
  const { favorites } = useFavorites();
  const [searchParams, setSearchParams] = useSearchParams();
  const [acteurs, setActeurs] = useState<ActeurLocal[]>([]);
  const [events, setEvents] = useState<AgendaEvenement[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeLayers, setActiveLayers] = useState<Set<MapLayer>>(new Set(LAYERS));
  const [selectedId, setSelectedId] = useState<string | null>(searchParams.get('pin'));
  const [locateToken, setLocateToken] = useState(0);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [favoritesOnly, setFavoritesOnly] = useState(
    searchParams.get('favoris') === '1' || searchParams.get('parcours') === '1',
  );
  const [showRoute, setShowRoute] = useState(searchParams.get('parcours') === '1');
  const [userPos, setUserPos] = useState<{ latitude: number; longitude: number } | null>(null);

  const handleLocated = useCallback(
    (lat: number, lng: number) => {
      setUserPos({ latitude: lat, longitude: lng });
      showToast(t('map.located'));
    },
    [showToast, t],
  );
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

  const favoriteIds = useMemo(() => favorites.map((place) => place.id), [favorites]);
  const geoFavorites = useMemo(() => favorites.filter(hasCoordinates), [favorites]);
  const orderedFavorites = useMemo(
    () => orderItinerary(geoFavorites, userPos ?? CHARTRONS_MAP_CENTER),
    [geoFavorites, userPos],
  );
  const routePositions = useMemo<[number, number][]>(
    () => (showRoute ? orderedFavorites.map((place) => [place.latitude, place.longitude]) : []),
    [showRoute, orderedFavorites],
  );
  const stopNumbers = useMemo(
    () =>
      showRoute
        ? Object.fromEntries(orderedFavorites.map((place, index) => [place.id, index + 1]))
        : {},
    [showRoute, orderedFavorites],
  );

  const selectedPin = useMemo(() => {
    const fromMap = allPins.find((pin) => pin.id === selectedId);
    if (fromMap) return fromMap;
    const fromFav = orderedFavorites.find((place) => place.id === selectedId);
    return fromFav ? favoriteToPin(fromFav) : null;
  }, [allPins, orderedFavorites, selectedId]);

  const visiblePins = useMemo(() => {
    const source = showRoute
      ? orderedFavorites.map((place) => allPins.find((pin) => pin.id === place.id) ?? favoriteToPin(place))
      : allPins.filter((pin) => {
          if (!activeLayers.has(pin.kind)) return false;
          if (favoritesOnly) return favoriteIds.includes(pin.id);
          return true;
        });

    if (selectedPin && !source.some((pin) => pin.id === selectedPin.id)) {
      return [...source, selectedPin];
    }
    return source;
  }, [showRoute, orderedFavorites, allPins, activeLayers, favoritesOnly, favoriteIds, selectedPin]);

  useEffect(() => {
    const pinId = searchParams.get('pin');
    if (pinId) {
      setSelectedId(pinId);
      const pin = allPins.find((item) => item.id === pinId);
      if (pin) {
        setActiveLayers((current) => new Set(current).add(pin.kind));
      }
    }
    const parcours = searchParams.get('parcours') === '1';
    const favoris = searchParams.get('favoris') === '1';
    setShowRoute(parcours);
    setFavoritesOnly(favoris || parcours);
  }, [searchParams, allPins]);

  const patchParams = (mutate: (params: URLSearchParams) => void) => {
    setSearchParams(
      (current) => {
        const next = new URLSearchParams(current);
        mutate(next);
        return next;
      },
      { replace: true },
    );
  };

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

  const toggleFavoritesLayer = () => {
    const next = !favoritesOnly;
    setFavoritesOnly(next);
    if (!next) {
      setShowRoute(false);
      patchParams((params) => {
        params.delete('favoris');
        params.delete('parcours');
      });
    } else {
      patchParams((params) => params.set('favoris', '1'));
    }
  };

  const toggleParcours = () => {
    if (!showRoute && geoFavorites.length < 2) {
      showToast(t('map.itinerary.needTwo'), 'info');
      return;
    }
    const next = !showRoute;
    setShowRoute(next);
    if (next) {
      setFavoritesOnly(true);
      patchParams((params) => {
        params.set('parcours', '1');
        params.set('favoris', '1');
      });
    } else {
      patchParams((params) => params.delete('parcours'));
    }
  };

  if (loading) return <Loading message={t('common.loading')} />;

  const selectedSharePath = selectedPin ? `/carte?pin=${encodeURIComponent(selectedPin.id)}` : '/carte';
  const itineraryDistance = formatDistance(itineraryDistanceKm(orderedFavorites), i18n.language);

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
        <button
          type="button"
          onClick={toggleFavoritesLayer}
          className={`shrink-0 touch-target px-3 py-2 rounded-full text-xs font-semibold border transition-all ${
            favoritesOnly
              ? 'bg-chartrons-bordeaux text-white border-chartrons-bordeaux'
              : 'bg-white text-chartrons-olive-dark border-chartrons-beige'
          }`}
        >
          ♥ {t('map.layers.favoris')}
        </button>
        <button
          type="button"
          onClick={toggleParcours}
          className={`shrink-0 touch-target px-3 py-2 rounded-full text-xs font-semibold border transition-all ${
            showRoute
              ? 'bg-chartrons-brass text-chartrons-olive-dark border-chartrons-brass'
              : 'bg-white text-chartrons-olive-dark border-chartrons-beige'
          }`}
        >
          {t('map.layers.parcours')}
        </button>
      </div>

      <div className="relative h-[55vh] min-h-[320px] rounded-2xl overflow-hidden border border-chartrons-beige shadow-card">
        <Suspense fallback={<Loading message={t('map.loading')} />}>
          <NeighborhoodMap
            pins={visiblePins}
            selectedId={selectedPin?.id ?? null}
            onSelect={setSelectedId}
            locateToken={locateToken}
            onLocated={handleLocated}
            onLocateError={handleLocateError}
            route={routePositions}
            stopNumbers={stopNumbers}
            favoriteIds={favoriteIds}
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

      {showRoute && (
        <Card className="!p-4">
          <h3 className="font-semibold text-chartrons-olive-dark">{t('map.itinerary.title')}</h3>
          {orderedFavorites.length < 2 ? (
            <p className="text-sm text-chartrons-warm-gray mt-2">{t('map.itinerary.needTwo')}</p>
          ) : (
            <>
              <p className="text-sm text-chartrons-warm-gray mt-1">
                {t('map.itinerary.meta', { count: orderedFavorites.length, distance: itineraryDistance })}
              </p>
              <ol className="mt-3 space-y-2">
                {orderedFavorites.map((place, index) => (
                  <li key={place.id}>
                    <button
                      type="button"
                      onClick={() => setSelectedId(place.id)}
                      className={`w-full text-left text-sm rounded-xl px-3 py-2 border ${
                        selectedPin?.id === place.id
                          ? 'border-chartrons-bordeaux bg-chartrons-bordeaux/5 text-chartrons-olive-dark'
                          : 'border-chartrons-beige text-chartrons-olive-dark'
                      }`}
                    >
                      <span className="font-semibold text-chartrons-bordeaux mr-2">{index + 1}.</span>
                      {place.title}
                    </button>
                  </li>
                ))}
              </ol>
              <div className="flex flex-wrap gap-2 mt-3">
                <DirectionsButton stops={orderedFavorites} label={t('map.itinerary.go')} />
                <ShareButton
                  title={t('map.itinerary.title')}
                  text={listShareText(orderedFavorites, t('share.listIntro'))}
                  url={appUrl('/carte?parcours=1')}
                  label={t('share.list')}
                />
              </div>
            </>
          )}
        </Card>
      )}

      {selectedPin ? (
        <Card className="!p-4">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <h3 className="font-semibold text-chartrons-olive-dark">{selectedPin.title}</h3>
              <div className="mt-1.5">
                <Badge variant="olive">{selectedPin.subtitle}</Badge>
              </div>
              <p className="text-xs text-chartrons-warm-gray mt-2">📍 {selectedPin.adresse}</p>
            </div>
            <FavoriteButton place={pinToFavorite(selectedPin)} />
          </div>
          <div className="flex flex-wrap gap-2 mt-3">
            <DirectionsButton latitude={selectedPin.latitude} longitude={selectedPin.longitude} />
            <ShareButton
              title={selectedPin.title}
              text={placeShareText(selectedPin)}
              url={appUrl(selectedSharePath)}
            />
            {selectedPin.href && (
              <Link to={selectedPin.href} className="flex-1">
                <Button type="button" size="sm" variant="secondary" className="w-full">
                  {t('map.seeMore')}
                </Button>
              </Link>
            )}
          </div>
        </Card>
      ) : (
        <p className="text-xs text-chartrons-warm-gray text-center">{t('map.tapHint')}</p>
      )}

      <FavoritesDrawer open={drawerOpen} onClose={() => setDrawerOpen(false)} />
    </div>
  );
}
