import type { FavoritePlace } from './favorites';
import { isFavoritePlace } from './favorites';
import type { AlertsSettings } from './nearbyAlerts';
import { loadAlertsSettings } from './nearbyAlerts';
import { isSavedRoute, type SavedRoute } from './routes';

export const CARNET_KIND = 'idea-chartrons-carnet';
export const CARNET_VERSION = 1;

export interface DeviceSyncPayload {
  kind: typeof CARNET_KIND;
  version: typeof CARNET_VERSION;
  exportedAt: string;
  favorites: FavoritePlace[];
  routes: SavedRoute[];
  alerts: AlertsSettings;
}

export function isDeviceSyncPayload(value: unknown): value is DeviceSyncPayload {
  if (!value || typeof value !== 'object') return false;
  const item = value as Record<string, unknown>;
  return item.kind === CARNET_KIND && Array.isArray(item.favorites) && Array.isArray(item.routes);
}

export function buildCarnet(favorites: FavoritePlace[], routes: SavedRoute[]): DeviceSyncPayload {
  return {
    kind: CARNET_KIND,
    version: CARNET_VERSION,
    exportedAt: new Date().toISOString(),
    favorites,
    routes,
    alerts: loadAlertsSettings(),
  };
}

export function parseCarnet(content: string): DeviceSyncPayload {
  const parsed = JSON.parse(content) as unknown;
  if (!isDeviceSyncPayload(parsed)) throw new Error('invalid-carnet');
  return {
    kind: CARNET_KIND,
    version: CARNET_VERSION,
    exportedAt: typeof parsed.exportedAt === 'string' ? parsed.exportedAt : new Date().toISOString(),
    favorites: parsed.favorites.filter(isFavoritePlace),
    routes: parsed.routes.filter(isSavedRoute),
    alerts: {
      notificationsEnabled: Boolean(
        parsed.alerts && typeof parsed.alerts === 'object'
          ? (parsed.alerts as AlertsSettings).notificationsEnabled
          : false,
      ),
    },
  };
}

export function downloadCarnet(payload: DeviceSyncPayload): void {
  const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = 'idea-chartrons-carnet.json';
  link.click();
  URL.revokeObjectURL(url);
}

export async function publishCarnet(payload: DeviceSyncPayload): Promise<{ code: string; expiresAt: string } | null> {
  try {
    const response = await fetch('/api/sync', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    if (!response.ok) return null;
    const data = (await response.json()) as { code?: string; expiresAt?: string };
    if (!data.code) return null;
    return { code: data.code, expiresAt: data.expiresAt ?? '' };
  } catch {
    return null;
  }
}

export async function fetchCarnetByCode(code: string): Promise<DeviceSyncPayload | null> {
  try {
    const response = await fetch(`/api/sync/${encodeURIComponent(code.trim().toUpperCase())}`);
    if (!response.ok) return null;
    const data = (await response.json()) as unknown;
    if (!isDeviceSyncPayload(data)) return null;
    return parseCarnet(JSON.stringify(data));
  } catch {
    return null;
  }
}
