import type { SavedRoute } from './routes';

export type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
};

type PwaListeners = {
  onOfflineReady?: () => void;
};

let listeners: PwaListeners = {};

export function setPwaListeners(next: PwaListeners): void {
  listeners = next;
}

export function registerPwa(): void {
  if (typeof window === 'undefined') return;
  void import('virtual:pwa-register')
    .then(({ registerSW }) => {
      registerSW({
        immediate: true,
        onOfflineReady() {
          listeners.onOfflineReady?.();
        },
      });
    })
    .catch(() => {
      // Dev without the virtual module, or blocked SW: app still works online.
    });
}

export function isStandaloneDisplay(): boolean {
  if (typeof window === 'undefined') return false;
  return (
    window.matchMedia('(display-mode: standalone)').matches ||
    Boolean((navigator as Navigator & { standalone?: boolean }).standalone)
  );
}

export function isIosDevice(): boolean {
  if (typeof navigator === 'undefined') return false;
  return /iphone|ipad|ipod/i.test(navigator.userAgent);
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
