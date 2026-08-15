import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { formatDistance } from '../lib/itinerary';
import {
  findNearbyAlerts,
  loadAlertsSettings,
  loadNotifiedAlertKeys,
  loadSeenAlertKeys,
  saveAlertsSettings,
  saveNotifiedAlertKeys,
  saveSeenAlertKeys,
  type NearbyAlert,
} from '../lib/nearbyAlerts';
import { useFavorites } from '../context/FavoritesContext';
import { useToast } from '../context/ToastContext';
import { api } from '../lib/api';
import { Badge, Button } from './ui';

function formatAlertDate(iso: string, locale: string): string {
  return new Date(iso).toLocaleDateString(locale.startsWith('fr') ? 'fr-FR' : 'en-GB', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function NearbyAlerts() {
  const { t, i18n } = useTranslation();
  const { favorites } = useFavorites();
  const { showToast } = useToast();
  const [alerts, setAlerts] = useState<NearbyAlert[]>([]);
  const [seen, setSeen] = useState<string[]>(loadSeenAlertKeys);
  const [notified, setNotified] = useState<string[]>(loadNotifiedAlertKeys);
  const [settings, setSettings] = useState(loadAlertsSettings);

  useEffect(() => {
    const sync = () => setSettings(loadAlertsSettings());
    window.addEventListener('idea-chartrons-alertes-change', sync);
    return () => window.removeEventListener('idea-chartrons-alertes-change', sync);
  }, []);

  useEffect(() => {
    if (favorites.length === 0) {
      setAlerts([]);
      return;
    }
    let cancelled = false;
    api
      .getEvents()
      .then((events) => {
        if (!cancelled) setAlerts(findNearbyAlerts(favorites, events));
      })
      .catch(console.error);
    return () => {
      cancelled = true;
    };
  }, [favorites]);

  const visible = useMemo(() => alerts.filter((alert) => !seen.includes(alert.key)), [alerts, seen]);

  useEffect(() => {
    if (!settings.notificationsEnabled || alerts.length === 0) return;
    if (typeof Notification === 'undefined' || Notification.permission !== 'granted') return;
    const fresh = alerts.filter((alert) => !notified.includes(alert.key) && !seen.includes(alert.key));
    if (fresh.length === 0) return;
    for (const alert of fresh) {
      new Notification(t('alerts.notificationTitle'), {
        body: t('alerts.notificationBody', {
          event: alert.eventTitle,
          place: alert.favoriteTitle,
        }),
        tag: alert.key,
      });
    }
    const next = [...new Set([...notified, ...fresh.map((alert) => alert.key)])];
    setNotified(next);
    saveNotifiedAlertKeys(next);
  }, [settings.notificationsEnabled, alerts, notified, seen, t]);

  const dismiss = (key: string) => {
    const next = [...new Set([...seen, key])];
    setSeen(next);
    saveSeenAlertKeys(next);
  };

  const enableNotifications = async () => {
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
    setSettings(next);
    saveAlertsSettings(next);
    showToast(t('alerts.enabled'));
  };

  if (visible.length === 0) return null;

  return (
    <div className="rounded-2xl border border-chartrons-brass/40 bg-gradient-to-r from-chartrons-brass/15 to-white p-4 shadow-card mb-4">
      <div className="flex items-start justify-between gap-2">
        <div>
          <Badge variant="brass" icon="🔔">
            {t('alerts.badge')}
          </Badge>
          <p className="font-semibold text-chartrons-bordeaux text-sm mt-2">{t('alerts.title')}</p>
          <p className="text-xs text-chartrons-warm-gray mt-1">{t('alerts.subtitle')}</p>
        </div>
        {!settings.notificationsEnabled && typeof Notification !== 'undefined' && (
          <Button type="button" size="sm" variant="secondary" onClick={enableNotifications}>
            {t('alerts.enable')}
          </Button>
        )}
      </div>
      <ul className="mt-3 space-y-2">
        {visible.map((alert) => (
          <li key={alert.key} className="rounded-xl border border-chartrons-beige bg-white p-3">
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <p className="text-sm font-semibold text-chartrons-olive-dark">{alert.eventTitle}</p>
                <p className="text-xs text-chartrons-warm-gray mt-1">
                  {t('alerts.near', {
                    place: alert.favoriteTitle,
                    distance: formatDistance(alert.distanceKm, i18n.language),
                  })}
                </p>
                <p className="text-xs text-chartrons-warm-gray mt-0.5">
                  {formatAlertDate(alert.dateDebut, i18n.language)} · {alert.eventLieu}
                </p>
              </div>
              <button
                type="button"
                onClick={() => dismiss(alert.key)}
                className="touch-target w-8 h-8 rounded-full text-chartrons-warm-gray"
                aria-label={t('alerts.dismiss')}
              >
                ✕
              </button>
            </div>
            <Link to={`/carte?pin=${encodeURIComponent(alert.eventId)}`} className="mt-2 inline-flex text-xs font-semibold text-chartrons-bordeaux">
              {t('alerts.seeMap')} →
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
