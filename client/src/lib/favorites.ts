export type FavoriteKind = 'commerce' | 'sante' | 'tourisme' | 'relais' | 'marche' | 'event';

export interface FavoritePlace {
  id: string;
  kind: FavoriteKind;
  title: string;
  subtitle: string;
  adresse: string;
  latitude: number | null;
  longitude: number | null;
  href: string;
  savedAt: string;
}

export type FavoriteInput = Omit<FavoritePlace, 'savedAt'>;

export const FAVORITES_STORAGE_KEY = 'idea-chartrons-favoris';

export function loadFavorites(): FavoritePlace[] {
  try {
    const raw = localStorage.getItem(FAVORITES_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(isFavoritePlace);
  } catch {
    return [];
  }
}

export function saveFavorites(favorites: FavoritePlace[]): void {
  try {
    localStorage.setItem(FAVORITES_STORAGE_KEY, JSON.stringify(favorites));
  } catch {
    // Quota or private mode: keep in-memory list for the current session.
  }
}

function isFavoritePlace(value: unknown): value is FavoritePlace {
  if (!value || typeof value !== 'object') return false;
  const item = value as Record<string, unknown>;
  return typeof item.id === 'string' && typeof item.title === 'string' && typeof item.kind === 'string';
}
