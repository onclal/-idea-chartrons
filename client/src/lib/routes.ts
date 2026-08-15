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

export function isRouteStop(value: unknown): value is RouteStop {
  if (!value || typeof value !== 'object') return false;
  const item = value as Record<string, unknown>;
  return (
    typeof item.id === 'string' &&
    typeof item.title === 'string' &&
    typeof item.latitude === 'number' &&
    typeof item.longitude === 'number' &&
    Number.isFinite(item.latitude) &&
    Number.isFinite(item.longitude)
  );
}

export function isSavedRoute(value: unknown): value is SavedRoute {
  if (!value || typeof value !== 'object') return false;
  const item = value as Record<string, unknown>;
  return (
    typeof item.id === 'string' &&
    typeof item.name === 'string' &&
    Array.isArray(item.stops) &&
    item.stops.filter(isRouteStop).length >= 1
  );
}

function normalizeSavedRoute(value: SavedRoute, newId = false): SavedRoute {
  const now = new Date().toISOString();
  const stops = value.stops.filter(isRouteStop).map((stop) => ({
    id: stop.id,
    kind: stop.kind || 'tourisme',
    title: stop.title,
    subtitle: stop.subtitle || '',
    adresse: stop.adresse || '',
    latitude: stop.latitude,
    longitude: stop.longitude,
    href: stop.href || '/carte',
  }));
  return {
    id: newId ? `route-${Date.now()}-${Math.random().toString(36).slice(2, 6)}` : value.id,
    name: value.name.trim() || 'Parcours',
    stops,
    createdAt: typeof value.createdAt === 'string' ? value.createdAt : now,
    updatedAt: now,
  };
}

function parseRouteGpx(xml: string, filename: string): SavedRoute {
  const doc = new DOMParser().parseFromString(xml, 'application/xml');
  if (doc.querySelector('parsererror')) {
    throw new Error('invalid-gpx');
  }
  const name =
    doc.querySelector('rte > name, trk > name, metadata > name')?.textContent?.trim() ||
    filename.replace(/\.[^.]+$/, '') ||
    'Parcours';
  const points = [...doc.querySelectorAll('rtept, trkpt, wpt')];
  const stops: RouteStop[] = points
    .map((point, index) => {
      const latitude = Number(point.getAttribute('lat'));
      const longitude = Number(point.getAttribute('lon'));
      const title = point.querySelector('name')?.textContent?.trim() || `${name} ${index + 1}`;
      const adresse = point.querySelector('desc')?.textContent?.trim() || '';
      return {
        id: `gpx-${Date.now()}-${index}`,
        kind: 'tourisme' as const,
        title,
        subtitle: 'Import GPX',
        adresse,
        latitude,
        longitude,
        href: '/carte',
      };
    })
    .filter((stop) => Number.isFinite(stop.latitude) && Number.isFinite(stop.longitude));
  if (stops.length < 1) throw new Error('empty-route');
  return createSavedRoute(name, stops);
}

export function parseRouteFile(content: string, filename = 'parcours.json'): SavedRoute[] {
  const trimmed = content.trim();
  const looksGpx = filename.toLowerCase().endsWith('.gpx') || trimmed.includes('<gpx');
  if (looksGpx) return [parseRouteGpx(trimmed, filename)];

  const parsed = JSON.parse(trimmed) as unknown;
  if (isSavedRoute(parsed)) return [normalizeSavedRoute(parsed, true)];
  if (Array.isArray(parsed)) {
    const routes = parsed.filter(isSavedRoute).map((route) => normalizeSavedRoute(route, true));
    if (routes.length === 0) throw new Error('empty-route');
    return routes;
  }
  throw new Error('invalid-json');
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
