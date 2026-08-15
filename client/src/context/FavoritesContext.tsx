import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from 'react';
import {
  loadFavorites,
  saveFavorites,
  type FavoriteInput,
  type FavoritePlace,
} from '../lib/favorites';

interface FavoritesContextValue {
  favorites: FavoritePlace[];
  isFavorite: (id: string) => boolean;
  toggleFavorite: (place: FavoriteInput) => boolean;
  removeFavorite: (id: string) => void;
  mergeFavorites: (incoming: FavoritePlace[]) => void;
  replaceFavorites: (incoming: FavoritePlace[]) => void;
}

const FavoritesContext = createContext<FavoritesContextValue | null>(null);

export function FavoritesProvider({ children }: { children: ReactNode }) {
  const [favorites, setFavorites] = useState<FavoritePlace[]>(loadFavorites);

  const persist = useCallback((next: FavoritePlace[]) => {
    setFavorites(next);
    saveFavorites(next);
  }, []);

  const isFavorite = useCallback((id: string) => favorites.some((item) => item.id === id), [favorites]);

  const toggleFavorite = useCallback(
    (place: FavoriteInput) => {
      const exists = favorites.some((item) => item.id === place.id);
      if (exists) {
        persist(favorites.filter((item) => item.id !== place.id));
        return false;
      }
      persist([{ ...place, savedAt: new Date().toISOString() }, ...favorites]);
      return true;
    },
    [favorites, persist],
  );

  const removeFavorite = useCallback(
    (id: string) => persist(favorites.filter((item) => item.id !== id)),
    [favorites, persist],
  );

  const mergeFavorites = useCallback(
    (incoming: FavoritePlace[]) => {
      const byId = new Map(favorites.map((item) => [item.id, item]));
      for (const place of incoming) {
        byId.set(place.id, place);
      }
      persist([...byId.values()]);
    },
    [favorites, persist],
  );

  const replaceFavorites = useCallback(
    (incoming: FavoritePlace[]) => persist(incoming),
    [persist],
  );

  const value = useMemo(
    () => ({ favorites, isFavorite, toggleFavorite, removeFavorite, mergeFavorites, replaceFavorites }),
    [favorites, isFavorite, toggleFavorite, removeFavorite, mergeFavorites, replaceFavorites],
  );

  return <FavoritesContext.Provider value={value}>{children}</FavoritesContext.Provider>;
}

export function useFavorites() {
  const ctx = useContext(FavoritesContext);
  if (!ctx) throw new Error('useFavorites must be used within FavoritesProvider');
  return ctx;
}
