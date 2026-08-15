import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import {
  isIosDevice,
  isStandaloneDisplay,
  setPwaListeners,
  type BeforeInstallPromptEvent,
} from '../lib/pwa';

interface PwaContextValue {
  online: boolean;
  installed: boolean;
  offlineReady: boolean;
  canInstall: boolean;
  isIos: boolean;
  install: () => Promise<void>;
}

const PwaContext = createContext<PwaContextValue | null>(null);

const DISMISS_KEY = 'idea-chartrons-pwa-banner-dismissed';

export function isPwaBannerDismissed(): boolean {
  try {
    return sessionStorage.getItem(DISMISS_KEY) === '1';
  } catch {
    return false;
  }
}

export function dismissPwaBanner(): void {
  try {
    sessionStorage.setItem(DISMISS_KEY, '1');
  } catch {
    // Ignore.
  }
}

export function PwaProvider({ children }: { children: ReactNode }) {
  const [online, setOnline] = useState(() => (typeof navigator === 'undefined' ? true : navigator.onLine));
  const [installed, setInstalled] = useState(isStandaloneDisplay);
  const [offlineReady, setOfflineReady] = useState(false);
  const [installEvent, setInstallEvent] = useState<BeforeInstallPromptEvent | null>(null);

  useEffect(() => {
    setPwaListeners({ onOfflineReady: () => setOfflineReady(true) });
    const onPrompt = (event: Event) => {
      event.preventDefault();
      setInstallEvent(event as BeforeInstallPromptEvent);
    };
    const onInstalled = () => {
      setInstalled(true);
      setInstallEvent(null);
    };
    window.addEventListener('beforeinstallprompt', onPrompt);
    window.addEventListener('appinstalled', onInstalled);
    const onOnline = () => setOnline(true);
    const onOffline = () => setOnline(false);
    window.addEventListener('online', onOnline);
    window.addEventListener('offline', onOffline);
    setInstalled(isStandaloneDisplay());
    if ('serviceWorker' in navigator) {
      void navigator.serviceWorker.getRegistration().then((registration) => {
        if (registration) setOfflineReady(true);
      });
    }
    return () => {
      window.removeEventListener('beforeinstallprompt', onPrompt);
      window.removeEventListener('appinstalled', onInstalled);
      window.removeEventListener('online', onOnline);
      window.removeEventListener('offline', onOffline);
    };
  }, []);

  const install = useCallback(async () => {
    if (!installEvent) return;
    await installEvent.prompt();
    const choice = await installEvent.userChoice;
    if (choice.outcome === 'accepted') setInstallEvent(null);
  }, [installEvent]);

  const value = useMemo(
    () => ({
      online,
      installed,
      offlineReady,
      canInstall: Boolean(installEvent) && !installed,
      isIos: isIosDevice(),
      install,
    }),
    [online, installed, offlineReady, installEvent, install],
  );

  return <PwaContext.Provider value={value}>{children}</PwaContext.Provider>;
}

export function usePwa() {
  const ctx = useContext(PwaContext);
  if (!ctx) throw new Error('usePwa must be used within PwaProvider');
  return ctx;
}
