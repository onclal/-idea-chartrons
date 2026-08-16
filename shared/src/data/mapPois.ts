export const LOCAL_RELAIS_ADDRESS = '26 place Jean Jaques Rabaud, 33000 Bordeaux';
export const LOCAL_RELAIS_PHONE = '05 56 52 00 26';

export const CHARTRONS_MAP_CENTER = {
  latitude: 44.85175,
  longitude: -0.57055,
} as const;

export type MapPoiKind = 'relais' | 'marche';

export interface StaticMapPoi {
  id: string;
  kind: MapPoiKind;
  titleKey: string;
  descriptionKey: string;
  adresse: string;
  telephone?: string | null;
  latitude: number;
  longitude: number;
  href: string;
}

export const STATIC_MAP_POIS: StaticMapPoi[] = [
  {
    id: 'poi-relais',
    kind: 'relais',
    titleKey: 'map.pois.relaisTitle',
    descriptionKey: 'map.pois.relaisHint',
    adresse: LOCAL_RELAIS_ADDRESS,
    telephone: LOCAL_RELAIS_PHONE,
    latitude: 44.85265,
    longitude: -0.57385,
    href: '/relais',
  },
  {
    id: 'poi-marche-chartrons',
    kind: 'marche',
    titleKey: 'map.pois.marcheTitle',
    descriptionKey: 'map.pois.marcheHint',
    adresse: 'Place du Marché des Chartrons, quais des Chartrons, 33000 Bordeaux',
    latitude: 44.85235,
    longitude: -0.56985,
    href: '/events',
  },
  {
    id: 'poi-halles',
    kind: 'marche',
    titleKey: 'map.pois.hallesTitle',
    descriptionKey: 'map.pois.hallesHint',
    adresse: 'Halles des Chartrons, Quai des Chartrons, 33000 Bordeaux',
    latitude: 44.8498,
    longitude: -0.5669,
    href: '/carte',
  },
];

export function hasCoordinates<T extends { latitude: number | null; longitude: number | null }>(
  point: T,
): point is T & { latitude: number; longitude: number } {
  return point.latitude != null && point.longitude != null;
}
