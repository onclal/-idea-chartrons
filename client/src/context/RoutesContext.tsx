import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from 'react';
import { deleteCachedRoute } from '../lib/pwa';
import {
  createSavedRoute,
  loadSavedRoutes,
  persistSavedRoutes,
  rememberRouteOffline,
  type RouteStop,
  type SavedRoute,
} from '../lib/routes';

interface RoutesContextValue {
  routes: SavedRoute[];
  getRoute: (id: string) => SavedRoute | undefined;
  saveRoute: (name: string, stops: RouteStop[]) => Promise<SavedRoute>;
  updateRoute: (id: string, patch: { name?: string; stops?: RouteStop[] }) => Promise<SavedRoute | null>;
  deleteRoute: (id: string) => Promise<void>;
}

const RoutesContext = createContext<RoutesContextValue | null>(null);

export function RoutesProvider({ children }: { children: ReactNode }) {
  const [routes, setRoutes] = useState<SavedRoute[]>(loadSavedRoutes);

  const persist = useCallback((next: SavedRoute[]) => {
    setRoutes(next);
    persistSavedRoutes(next);
  }, []);

  const getRoute = useCallback((id: string) => routes.find((route) => route.id === id), [routes]);

  const saveRoute = useCallback(async (name: string, stops: RouteStop[]) => {
    const route = createSavedRoute(name, stops);
    persist([route, ...routes.filter((item) => item.id !== route.id)]);
    await rememberRouteOffline(route);
    return route;
  }, [persist, routes]);

  const updateRoute = useCallback(
    async (id: string, patch: { name?: string; stops?: RouteStop[] }) => {
      const current = routes.find((route) => route.id === id);
      if (!current) return null;
      const updated: SavedRoute = {
        ...current,
        name: patch.name?.trim() || current.name,
        stops: patch.stops ?? current.stops,
        updatedAt: new Date().toISOString(),
      };
      persist(routes.map((route) => (route.id === id ? updated : route)));
      await rememberRouteOffline(updated);
      return updated;
    },
    [persist, routes],
  );

  const deleteRoute = useCallback(
    async (id: string) => {
      persist(routes.filter((route) => route.id !== id));
      await deleteCachedRoute(id);
    },
    [persist, routes],
  );

  const value = useMemo(
    () => ({ routes, getRoute, saveRoute, updateRoute, deleteRoute }),
    [routes, getRoute, saveRoute, updateRoute, deleteRoute],
  );

  return <RoutesContext.Provider value={value}>{children}</RoutesContext.Provider>;
}

export function useSavedRoutes() {
  const ctx = useContext(RoutesContext);
  if (!ctx) throw new Error('useSavedRoutes must be used within RoutesProvider');
  return ctx;
}
