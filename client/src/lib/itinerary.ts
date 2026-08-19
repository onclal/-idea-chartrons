import { formatDistanceMeters, haversineKm as haversineKmShared } from '@idea-chartrons/shared';

export interface GeoPoint {
  latitude: number;
  longitude: number;
}

export function haversineKm(a: GeoPoint, b: GeoPoint): number {
  return haversineKmShared(a, b);
}

export function itineraryDistanceKm(points: GeoPoint[]): number {
  let total = 0;
  for (let i = 1; i < points.length; i += 1) {
    total += haversineKm(points[i - 1], points[i]);
  }
  return total;
}

export function formatDistance(km: number, locale: string): string {
  if (km < 1) return `${Math.round(km * 1000)} m`;
  const value = km.toFixed(1);
  return locale.startsWith('fr') ? `${value.replace('.', ',')} km` : `${value} km`;
}

function reverseSegment<T>(items: T[], from: number, to: number): void {
  while (from < to) {
    const swap = items[from];
    items[from] = items[to];
    items[to] = swap;
    from += 1;
    to -= 1;
  }
}

function twoOpt<T extends GeoPoint>(route: T[]): T[] {
  if (route.length < 4) return route;
  const path = [...route];
  let improved = true;
  let guard = 0;
  while (improved && guard < 40) {
    improved = false;
    guard += 1;
    for (let i = 0; i < path.length - 2; i += 1) {
      for (let k = i + 2; k < path.length; k += 1) {
        const a = path[i];
        const b = path[i + 1];
        const c = path[k];
        const d = path[k + 1];
        const current = haversineKm(a, b) + (d ? haversineKm(c, d) : 0);
        const swapped = haversineKm(a, c) + (d ? haversineKm(b, d) : 0);
        if (swapped + 1e-9 < current) {
          reverseSegment(path, i + 1, k);
          improved = true;
        }
      }
    }
  }
  return path;
}

export function orderItinerary<T extends GeoPoint>(places: T[], start: GeoPoint): T[] {
  if (places.length <= 1) return [...places];
  const remaining = [...places];
  const ordered: T[] = [];
  let current = start;
  while (remaining.length > 0) {
    let bestIdx = 0;
    let bestDist = Infinity;
    for (let i = 0; i < remaining.length; i += 1) {
      const distance = haversineKm(current, remaining[i]);
      if (distance < bestDist) {
        bestDist = distance;
        bestIdx = i;
      }
    }
    const [next] = remaining.splice(bestIdx, 1);
    ordered.push(next);
    current = next;
  }
  return twoOpt(ordered);
}

export function walkingDirectionsUrl(destination: GeoPoint, waypoints: GeoPoint[] = []): string {
  const params = new URLSearchParams({
    api: '1',
    destination: `${destination.latitude},${destination.longitude}`,
    travelmode: 'walking',
  });
  if (waypoints.length > 0) {
    params.set(
      'waypoints',
      waypoints.slice(0, 9).map((point) => `${point.latitude},${point.longitude}`).join('|'),
    );
  }
  return `https://www.google.com/maps/dir/?${params.toString()}`;
}

export function moveItem<T>(items: T[], from: number, delta: number): T[] {
  const to = from + delta;
  if (to < 0 || to >= items.length) return items;
  const next = [...items];
  const [item] = next.splice(from, 1);
  next.splice(to, 0, item);
  return next;
}

export function walkingItineraryUrl(stops: GeoPoint[]): string | null {
  if (stops.length === 0) return null;
  if (stops.length === 1) return walkingDirectionsUrl(stops[0]);
  return walkingDirectionsUrl(stops[stops.length - 1], stops.slice(0, -1));
}

/** Vitesse piéton de quartier (~4,8 km/h). */
export const WALKING_SPEED_M_PER_MIN = 80;

export function walkingEtaMinutes(meters: number, speedMPerMin = WALKING_SPEED_M_PER_MIN): number {
  if (!Number.isFinite(meters) || meters <= 0) return 1;
  return Math.max(1, Math.round(meters / speedMPerMin));
}

/** Ex. « 344 m - 4 min » */
export function formatWalkingItinerary(meters: number, locale = 'fr'): string {
  const distance = formatDistanceMeters(meters, locale) || `${Math.round(Math.max(0, meters))} m`;
  return `${distance} - ${walkingEtaMinutes(meters)} min`;
}
