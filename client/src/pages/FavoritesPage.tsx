import { Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { hasCoordinates } from '@idea-chartrons/shared';
import { Badge, Button, Card, EmptyState } from '../components/ui';
import { PageHelp } from '../components/PageHelp';
import { DirectionsButton } from '../components/DirectionsButton';
import { ShareButton } from '../components/ShareButton';
import { useFavorites } from '../context/FavoritesContext';
import { useSavedRoutes } from '../context/RoutesContext';
import { useToast } from '../context/ToastContext';
import { appUrl, listShareText, placeShareText } from '../lib/share';
import { exportRouteGpx, exportRouteJson } from '../lib/routes';
import {
  loadAlertsSettings,
  saveAlertsSettings,
} from '../lib/nearbyAlerts';
import { useState } from 'react';

export function FavoritesPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { showToast } = useToast();
  const { favorites, removeFavorite } = useFavorites();
  const { routes, deleteRoute } = useSavedRoutes();
  const geoCount = favorites.filter(hasCoordinates).length;
  const [alertSettings, setAlertSettings] = useState(loadAlertsSettings);

  const openItinerary = () => {
    if (geoCount < 2) {
      showToast(t('map.itinerary.needTwo'), 'info');
      return;
    }
    navigate('/carte?parcours=1');
  };

  const toggleAlerts = async () => {
    if (alertSettings.notificationsEnabled) {
      const next = { notificationsEnabled: false };
      setAlertSettings(next);
      saveAlertsSettings(next);
      showToast(t('alerts.disabled'), 'info');
      return;
    }
    if (typeof Notification === 'undefined') {
      showToast(t('alerts.unsupported'), 'error');
      return;
    }
    const permission = await Notification.requestPermission();
    if (permission !== 'granted') {
      showToast(t('alerts.denied'), 'info');
      return;
    }
    const next = { notificationsEnabled: true };
    setAlertSettings(next);
    saveAlertsSettings(next);
    showToast(t('alerts.enabled'));
  };

  return (
    <div className="space-y-4 animate-fade-in">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <h2 className="text-xl font-bold text-chartrons-bordeaux">{t('favorites.title')}</h2>
          <p className="text-sm text-chartrons-warm-gray mt-1">{t('favorites.subtitle')}</p>
        </div>
        <PageHelp page="favoris" />
      </div>

      {favorites.length === 0 && routes.length === 0 ? (
        <EmptyState
          icon="♡"
          title={t('favorites.emptyTitle')}
          message={t('favorites.emptyHint')}
          action={{ label: t('favorites.goMap'), onClick: () => navigate('/carte') }}
        />
      ) : (
        <>
          {favorites.length > 0 && (
            <div className="flex flex-wrap gap-2">
              <Button type="button" size="sm" variant="bordeaux" className="flex-1" onClick={openItinerary}>
                {t('favorites.seeRoute')}
              </Button>
              <Link to="/carte?favoris=1" className="flex-1">
                <Button type="button" size="sm" variant="secondary" className="w-full">
                  {t('favorites.seeLayer')}
                </Button>
              </Link>
              <ShareButton
                title={t('favorites.title')}
                text={listShareText(favorites, t('share.listIntro'))}
                url={appUrl(geoCount >= 2 ? '/carte?parcours=1' : '/favoris')}
                label={t('share.list')}
              />
            </div>
          )}

          <Card className="!p-4">
            <p className="font-semibold text-chartrons-olive-dark">{t('alerts.settingsTitle')}</p>
            <p className="text-xs text-chartrons-warm-gray mt-1">{t('alerts.settingsHint')}</p>
            <Button type="button" size="sm" variant={alertSettings.notificationsEnabled ? 'secondary' : 'bordeaux'} className="mt-3" onClick={() => void toggleAlerts()}>
              {alertSettings.notificationsEnabled ? t('alerts.disable') : t('alerts.enable')}
            </Button>
          </Card>

          {routes.length > 0 && (
            <section id="parcours" className="space-y-3">
              <h3 className="text-sm font-bold uppercase tracking-wide text-chartrons-olive">
                {t('routes.savedTitle')}
              </h3>
              {routes.map((route) => (
                <Card key={route.id} className="!p-4">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <h4 className="font-semibold text-chartrons-olive-dark">{route.name}</h4>
                      <p className="text-xs text-chartrons-warm-gray mt-1">
                        {t('routes.stopCount', { count: route.stops.length })} · {t('routes.offlineReady')}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => void deleteRoute(route.id)}
                      className="touch-target w-11 h-11 shrink-0 rounded-full text-chartrons-warm-gray"
                      aria-label={t('routes.delete', { name: route.name })}
                    >
                      ✕
                    </button>
                  </div>
                  <ol className="mt-2 text-xs text-chartrons-warm-gray space-y-0.5">
                    {route.stops.map((stop, index) => (
                      <li key={stop.id}>
                        {index + 1}. {stop.title}
                      </li>
                    ))}
                  </ol>
                  <div className="flex flex-wrap gap-2 mt-3">
                    <Link to={`/carte?parcours=${encodeURIComponent(route.id)}`} className="flex-1">
                      <Button type="button" size="sm" variant="bordeaux" className="w-full">
                        {t('routes.open')}
                      </Button>
                    </Link>
                    <Button
                      type="button"
                      size="sm"
                      variant="secondary"
                      className="flex-1"
                      onClick={() => {
                        exportRouteGpx(route);
                        showToast(t('routes.exported'));
                      }}
                    >
                      {t('routes.exportGpx')}
                    </Button>
                    <Button
                      type="button"
                      size="sm"
                      variant="secondary"
                      className="flex-1"
                      onClick={() => {
                        exportRouteJson(route);
                        showToast(t('routes.exported'));
                      }}
                    >
                      {t('routes.exportJson')}
                    </Button>
                  </div>
                </Card>
              ))}
            </section>
          )}

          <div className="space-y-3">
            {favorites.map((place) => (
              <Card key={place.id} className="!p-4">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <h3 className="font-semibold text-chartrons-olive-dark">{place.title}</h3>
                    <div className="mt-1.5">
                      <Badge variant="olive">{place.subtitle}</Badge>
                    </div>
                    <p className="text-xs text-chartrons-warm-gray mt-2">📍 {place.adresse}</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => removeFavorite(place.id)}
                    className="touch-target w-11 h-11 shrink-0 rounded-full bg-chartrons-bordeaux/10 text-chartrons-bordeaux"
                    aria-label={t('favorites.removeLabel', { name: place.title })}
                  >
                    ♥
                  </button>
                </div>
                <div className="flex flex-wrap gap-2 mt-3">
                  {place.latitude != null && place.longitude != null && (
                    <>
                      <Link to={`/carte?pin=${encodeURIComponent(place.id)}`} className="flex-1">
                        <Button type="button" size="sm" variant="secondary" className="w-full">
                          {t('favorites.seeMap')}
                        </Button>
                      </Link>
                      <DirectionsButton latitude={place.latitude} longitude={place.longitude} />
                    </>
                  )}
                  <ShareButton
                    title={place.title}
                    text={placeShareText(place)}
                    url={appUrl(`/carte?pin=${encodeURIComponent(place.id)}`)}
                  />
                  <Link to={place.href} className="flex-1">
                    <Button type="button" size="sm" variant="secondary" className="w-full">
                      {t('favorites.open')}
                    </Button>
                  </Link>
                </div>
              </Card>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
