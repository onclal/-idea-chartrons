import type { FavoriteKind, FavoritePlace } from './favorites';
import { cacheRouteOffline } from './pwa';

export interface RouteStop {
  id: string;
  kind: FavoriteKind;
  title: string;
  subtitle: string;
  adresse: string;
  latitude: number;
  longitude: number;
  href: string;
}

export interface SavedRoute {
  id: string;
  name: string;
  stops: RouteStop[];
  createdAt: string;
  updatedAt: string;
}

export const ROUTES_STORAGE_KEY = 'idea-chartrons-parcours';

export function toRouteStop(place: FavoritePlace & { latitude: number; longitude: number }): RouteStop {
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

export function loadSavedRoutes(): SavedRoute[] {
  try {
    const raw = localStorage.getItem(ROUTES_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(isSavedRoute);
  } catch {
    return [];
  }
}

export function persistSavedRoutes(routes: SavedRoute[]): void {
  try {
    localStorage.setItem(ROUTES_STORAGE_KEY, JSON.stringify(routes));
  } catch {
    // Quota or private mode: keep in-memory list for the current session.
  }
}

function isSavedRoute(value: unknown): value is SavedRoute {
  if (!value || typeof value !== 'object') return false;
  const item = value as Record<string, unknown>;
  return typeof item.id === 'string' && typeof item.name === 'string' && Array.isArray(item.stops);
}

export function createSavedRoute(name: string, stops: RouteStop[]): SavedRoute {
  const now = new Date().toISOString();
  return {
    id: `route-${Date.now()}`,
    name: name.trim() || 'Parcours',
    stops,
    createdAt: now,
    updatedAt: now,
  };
}

export async function rememberRouteOffline(route: SavedRoute): Promise<void> {
  await cacheRouteOffline(route);
}

function slug(value: string): string {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 48) || 'parcours';
}

function escapeXml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function downloadFile(filename: string, content: string, mime: string): void {
  const blob = new Blob([content], { type: mime });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}

export function exportRouteJson(route: SavedRoute): void {
  downloadFile(`${slug(route.name)}.json`, JSON.stringify(route, null, 2), 'application/json');
}

export function exportRouteGpx(route: SavedRoute): void {
  const points = route.stops
    .map(
      (stop) =>
        `    <rtept lat="${stop.latitude}" lon="${stop.longitude}"><name>${escapeXml(stop.title)}</name><desc>${escapeXml(stop.adresse)}</desc></rtept>`,
    )
    .join('\n');
  const gpx = `<?xml version="1.0" encoding="UTF-8"?>
<gpx version="1.1" creator="IDÉA CHARTRONS" xmlns="http://www.topografix.com/GPX/1/1">
  <metadata><name>${escapeXml(route.name)}</name></metadata>
  <rte>
    <name>${escapeXml(route.name)}</name>
${points}
  </rte>
</gpx>
`;
  downloadFile(`${slug(route.name)}.gpx`, gpx, 'application/gpx+xml');
}
