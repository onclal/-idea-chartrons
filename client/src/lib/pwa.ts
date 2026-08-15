import type { SavedRoute } from './routes';

export function registerPwa(): void {
  if (typeof window === 'undefined') return;
  void import('virtual:pwa-register')
    .then(({ registerSW }) => {
      registerSW({ immediate: true });
    })
    .catch(() => {
      // Dev without the virtual module, or blocked SW: app still works online.
    });
}

const ROUTES_CACHE = 'idea-chartrons-parcours-v1';

export async function cacheRouteOffline(route: SavedRoute): Promise<boolean> {
  if (!('caches' in window)) return false;
  try {
    const cache = await caches.open(ROUTES_CACHE);
    await cache.put(
      `/offline/parcours/${route.id}`,
      new Response(JSON.stringify(route), {
        headers: { 'Content-Type': 'application/json' },
      }),
    );
    return true;
  } catch {
    return false;
  }
}

export async function deleteCachedRoute(id: string): Promise<void> {
  if (!('caches' in window)) return;
  try {
    const cache = await caches.open(ROUTES_CACHE);
    await cache.delete(`/offline/parcours/${id}`);
  } catch {
    // Ignore cache failures.
  }
}
