import { hasCoordinates, type AgendaEvenement } from '@idea-chartrons/shared';
import type { FavoritePlace } from './favorites';
import { haversineKm } from './itinerary';

export const NEARBY_RADIUS_KM = 0.5;
export const ALERT_HORIZON_DAYS = 14;

export const ALERTS_SETTINGS_KEY = 'idea-chartrons-alertes-settings';
export const ALERTS_SEEN_KEY = 'idea-chartrons-alertes-vues';
export const ALERTS_NOTIFIED_KEY = 'idea-chartrons-alertes-notifiees';

export interface NearbyAlert {
  key: string;
  eventId: string;
  eventTitle: string;
  eventLieu: string;
  dateDebut: string;
  favoriteId: string;
  favoriteTitle: string;
  distanceKm: number;
}

export interface AlertsSettings {
  notificationsEnabled: boolean;
}

export function loadAlertsSettings(): AlertsSettings {
  try {
    const raw = localStorage.getItem(ALERTS_SETTINGS_KEY);
    if (!raw) return { notificationsEnabled: false };
    const parsed = JSON.parse(raw) as Partial<AlertsSettings>;
    return { notificationsEnabled: Boolean(parsed.notificationsEnabled) };
  } catch {
    return { notificationsEnabled: false };
  }
}

export function saveAlertsSettings(settings: AlertsSettings): void {
  try {
    localStorage.setItem(ALERTS_SETTINGS_KEY, JSON.stringify(settings));
    window.dispatchEvent(new Event('idea-chartrons-alertes-change'));
  } catch {
    // Ignore quota / private mode.
  }
}

export function loadSeenAlertKeys(): string[] {
  try {
    const raw = localStorage.getItem(ALERTS_SEEN_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as unknown;
    return Array.isArray(parsed) ? parsed.filter((item): item is string => typeof item === 'string') : [];
  } catch {
    return [];
  }
}

export function saveSeenAlertKeys(keys: string[]): void {
  try {
    localStorage.setItem(ALERTS_SEEN_KEY, JSON.stringify(keys));
  } catch {
    // Ignore quota / private mode.
  }
}

export function loadNotifiedAlertKeys(): string[] {
  try {
    const raw = localStorage.getItem(ALERTS_NOTIFIED_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as unknown;
    return Array.isArray(parsed) ? parsed.filter((item): item is string => typeof item === 'string') : [];
  } catch {
    return [];
  }
}

export function saveNotifiedAlertKeys(keys: string[]): void {
  try {
    localStorage.setItem(ALERTS_NOTIFIED_KEY, JSON.stringify(keys));
  } catch {
    // Ignore quota / private mode.
  }
}

export function findNearbyAlerts(
  favorites: FavoritePlace[],
  events: AgendaEvenement[],
  now = Date.now(),
): NearbyAlert[] {
  const horizon = now + ALERT_HORIZON_DAYS * 86400000;
  const geoFavorites = favorites.filter(hasCoordinates);
  const bestByEvent = new Map<string, NearbyAlert>();

  for (const event of events) {
    if (!hasCoordinates(event)) continue;
    const start = new Date(event.dateDebut).getTime();
    const end = new Date(event.dateFin).getTime();
    if (Number.isNaN(start) || Number.isNaN(end)) continue;
    if (end < now || start > horizon) continue;

    for (const place of geoFavorites) {
      const distanceKm = haversineKm(place, event);
      if (distanceKm > NEARBY_RADIUS_KM) continue;
      const current = bestByEvent.get(event.id);
      if (current && current.distanceKm <= distanceKm) continue;
      bestByEvent.set(event.id, {
        key: `${event.id}:${place.id}`,
        eventId: event.id,
        eventTitle: event.titre,
        eventLieu: event.lieu ?? place.adresse,
        dateDebut: event.dateDebut,
        favoriteId: place.id,
        favoriteTitle: place.title,
        distanceKm,
      });
    }
  }

  return [...bestByEvent.values()].sort(
    (a, b) => new Date(a.dateDebut).getTime() - new Date(b.dateDebut).getTime(),
  );
}
