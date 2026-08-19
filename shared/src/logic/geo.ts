import { CHARTRONS_MAP_CENTER } from '../data/mapPois.js';

export interface GeoCoordinates {
  latitude: number;
  longitude: number;
}

export type GeoOriginSource = 'gps' | 'fallback';

/** Cœur des Chartrons : repli si la géolocalisation du navigateur est refusée ou absente. */
export const DEFAULT_USER_ORIGIN: GeoCoordinates = {
  latitude: CHARTRONS_MAP_CENTER.latitude,
  longitude: CHARTRONS_MAP_CENTER.longitude,
};

/** Rayon de recherche concierge par défaut (piéton de quartier). */
export const DEFAULT_CONCIERGE_RADIUS_M = 500;

/** Rayon une fois la recherche élargie aux alentours. */
export const EXPANDED_CONCIERGE_RADIUS_M = 2500;

function toRad(value: number): number {
  return (value * Math.PI) / 180;
}

export function haversineKm(a: GeoCoordinates, b: GeoCoordinates): number {
  const earthKm = 6371;
  const dLat = toRad(b.latitude - a.latitude);
  const dLng = toRad(b.longitude - a.longitude);
  const lat1 = toRad(a.latitude);
  const lat2 = toRad(b.latitude);
  const h =
    Math.sin(dLat / 2) ** 2 + Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2;
  return 2 * earthKm * Math.asin(Math.min(1, Math.sqrt(h)));
}

export function haversineMeters(a: GeoCoordinates, b: GeoCoordinates): number {
  return haversineKm(a, b) * 1000;
}

export function isGeoCoordinates(value: unknown): value is GeoCoordinates {
  if (!value || typeof value !== 'object') return false;
  const point = value as { latitude?: unknown; longitude?: unknown };
  return (
    typeof point.latitude === 'number' &&
    typeof point.longitude === 'number' &&
    Number.isFinite(point.latitude) &&
    Number.isFinite(point.longitude) &&
    Math.abs(point.latitude) <= 90 &&
    Math.abs(point.longitude) <= 180
  );
}

export function resolveUserOrigin(value: unknown): GeoCoordinates {
  return isGeoCoordinates(value) ? value : DEFAULT_USER_ORIGIN;
}

/** Distance affichable : mètres entiers sous 1 km, sinon km à une décimale. */
export function formatDistanceMeters(meters: number, locale = 'fr'): string {
  if (!Number.isFinite(meters) || meters < 0) return '';
  if (meters < 1000) return `${Math.round(meters)} m`;
  const km = meters / 1000;
  const value = km >= 10 ? km.toFixed(0) : km.toFixed(1);
  const formatted = locale.toLowerCase().startsWith('fr') ? value.replace('.', ',') : value;
  return `${formatted} km`;
}

export function expandedSearchRadius(strictRadiusM: number): number {
  return Math.max(strictRadiusM * 4, EXPANDED_CONCIERGE_RADIUS_M);
}
