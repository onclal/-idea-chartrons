/// <reference types="vite/client" />

interface ImportMetaEnv {
  /** Code d'accès du panneau d'administration (mode invité : seule identité de la plateforme). */
  readonly VITE_ADMIN_PASSCODE?: string;
  /** Backend concierge IA ; absent sur GitHub Pages, le moteur local prend alors le relais. */
  readonly VITE_CONCIERGE_API_URL?: string;
}

declare module 'virtual:pwa-register' {
  export interface RegisterSWOptions {
    immediate?: boolean;
    onNeedRefresh?: () => void;
    onOfflineReady?: () => void;
    onRegistered?: (registration: ServiceWorkerRegistration | undefined) => void;
  }

  export function registerSW(options?: RegisterSWOptions): (reloadPage?: boolean) => Promise<void>;
}
