import { useEffect, useRef, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { QRCodeSVG } from 'qrcode.react';
import { Badge, Button, Card, Input } from './ui';
import { FileImportButton } from './FileImportButton';
import { useFavorites } from '../context/FavoritesContext';
import { useSavedRoutes } from '../context/RoutesContext';
import { usePwa } from '../context/PwaContext';
import { useToast } from '../context/ToastContext';
import { saveAlertsSettings } from '../lib/nearbyAlerts';
import { parseRouteFile } from '../lib/routes';
import {
  buildCarnet,
  downloadCarnet,
  fetchCarnetByCode,
  isDeviceSyncPayload,
  parseCarnet,
  publishCarnet,
  type DeviceSyncPayload,
} from '../lib/sync';
import { appUrl } from '../lib/share';

export function CarnetSyncCard() {
  const { t } = useTranslation();
  const { showToast } = useToast();
  const { favorites, mergeFavorites, replaceFavorites } = useFavorites();
  const { routes, importRoute, replaceRoutes } = useSavedRoutes();
  const { online, installed, offlineReady, canInstall, isIos, install } = usePwa();
  const [searchParams, setSearchParams] = useSearchParams();
  const [code, setCode] = useState('');
  const [published, setPublished] = useState<{ code: string; expiresAt: string } | null>(null);
  const [busy, setBusy] = useState(false);
  const handledSync = useRef<string | null>(null);

  const applyCarnet = async (payload: DeviceSyncPayload, replace: boolean) => {
    if (replace) {
      replaceFavorites(payload.favorites);
      await replaceRoutes(payload.routes);
    } else {
      mergeFavorites(payload.favorites);
      for (const route of payload.routes) {
        await importRoute(route, true);
      }
    }
    saveAlertsSettings(payload.alerts);
    showToast(
      t('sync.imported', { favorites: payload.favorites.length, routes: payload.routes.length }),
    );
  };

  useEffect(() => {
    const syncCode = searchParams.get('sync');
    if (!syncCode || handledSync.current === syncCode) return;
    handledSync.current = syncCode;
    let cancelled = false;
    void fetchCarnetByCode(syncCode).then((payload) => {
      if (cancelled || !payload) {
        if (!cancelled) showToast(t('sync.codeMissing'), 'error');
        return;
      }
      void applyCarnet(payload, false);
      setSearchParams(
        (current) => {
          const next = new URLSearchParams(current);
          next.delete('sync');
          return next;
        },
        { replace: true },
      );
    });
    return () => {
      cancelled = true;
    };
    // Intentional: run once when the sync code is present.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams]);

  const handleFile = async (content: string, filename: string) => {
    try {
      if (filename.toLowerCase().endsWith('.gpx') || content.includes('<gpx')) {
        const [route] = parseRouteFile(content, filename);
        await importRoute(route, false);
        showToast(t('routes.imported', { name: route.name }));
        return;
      }
      const parsed = JSON.parse(content) as unknown;
      if (isDeviceSyncPayload(parsed)) {
        await applyCarnet(parseCarnet(content), false);
        return;
      }
      const imported = parseRouteFile(content, filename);
      for (const route of imported) {
        await importRoute(route, false);
      }
      showToast(t('routes.importedCount', { count: imported.length }));
    } catch {
      showToast(t('sync.invalidFile'), 'error');
    }
  };

  const handlePublish = async () => {
    setBusy(true);
    try {
      const result = await publishCarnet(buildCarnet(favorites, routes));
      if (!result) {
        showToast(t('sync.publishFailed'), 'info');
        return;
      }
      setPublished(result);
      showToast(t('sync.published'));
    } finally {
      setBusy(false);
    }
  };

  const handleRetrieve = async () => {
    if (!code.trim()) return;
    setBusy(true);
    try {
      const payload = await fetchCarnetByCode(code);
      if (!payload) {
        showToast(t('sync.codeMissing'), 'error');
        return;
      }
      await applyCarnet(payload, false);
    } finally {
      setBusy(false);
    }
  };

  const copyCarnet = async () => {
    try {
      await navigator.clipboard.writeText(JSON.stringify(buildCarnet(favorites, routes), null, 2));
      showToast(t('sync.copied'));
    } catch {
      showToast(t('share.failed'), 'error');
    }
  };

  return (
    <Card className="!p-4 space-y-4">
      <div>
        <h4 className="text-sm font-semibold text-chartrons-olive-dark">{t('pwa.profileTitle')}</h4>
        <p className="text-xs text-chartrons-warm-gray mt-1">{t('pwa.profileHint')}</p>
        <div className="flex flex-wrap gap-2 mt-2">
          <Badge variant={online ? 'olive' : 'brass'}>{online ? t('pwa.online') : t('pwa.offlineBadge')}</Badge>
          {installed && <Badge variant="brass">{t('pwa.installed')}</Badge>}
          {offlineReady && <Badge variant="olive">{t('pwa.readyBadge')}</Badge>}
        </div>
        {canInstall && (
          <Button type="button" size="sm" variant="bordeaux" className="mt-3" onClick={() => void install()}>
            {t('pwa.install')}
          </Button>
        )}
        {isIos && !installed && <p className="text-xs text-chartrons-warm-gray mt-2">{t('pwa.iosHint')}</p>}
      </div>

      <div className="border-t border-chartrons-beige pt-4">
        <h4 className="text-sm font-semibold text-chartrons-olive-dark">{t('sync.title')}</h4>
        <p className="text-xs text-chartrons-warm-gray mt-1">{t('sync.hint')}</p>
        <p className="text-xs text-chartrons-olive mt-2">
          {t('sync.summary', { favorites: favorites.length, routes: routes.length })}
        </p>
        <div className="flex flex-wrap gap-2 mt-3">
          <Button
            type="button"
            size="sm"
            variant="bordeaux"
            className="flex-1"
            onClick={() => downloadCarnet(buildCarnet(favorites, routes))}
          >
            {t('sync.export')}
          </Button>
          <Button type="button" size="sm" variant="secondary" className="flex-1" onClick={() => void copyCarnet()}>
            {t('sync.copy')}
          </Button>
          <FileImportButton
            accept=".json,.gpx,application/json,application/gpx+xml,text/xml"
            label={t('sync.importFile')}
            onText={handleFile}
          />
        </div>
        <div className="flex flex-wrap gap-2 mt-2">
          <Button type="button" size="sm" variant="secondary" className="flex-1" disabled={busy} onClick={() => void handlePublish()}>
            {t('sync.publish')}
          </Button>
        </div>
        {published && (
          <div className="mt-3 rounded-xl border border-chartrons-beige bg-white p-3 text-center">
            <p className="text-xs text-chartrons-warm-gray">{t('sync.codeLabel')}</p>
            <p className="text-2xl font-bold tracking-[0.3em] text-chartrons-bordeaux mt-1">{published.code}</p>
            <div className="flex justify-center mt-3">
              <QRCodeSVG value={appUrl(`/carnet?sync=${published.code}`)} size={128} bgColor="#FFFFFF" fgColor="#1F4D3A" />
            </div>
            <p className="text-[11px] text-chartrons-warm-gray mt-2">{t('sync.qrHint')}</p>
          </div>
        )}
        <div className="mt-3 space-y-2">
          <Input
            label={t('sync.retrieveLabel')}
            value={code}
            onChange={(event) => setCode(event.target.value.toUpperCase())}
            maxLength={8}
            placeholder="A7K2M9"
          />
          <Button type="button" size="sm" variant="secondary" className="w-full" disabled={busy || !code.trim()} onClick={() => void handleRetrieve()}>
            {t('sync.retrieve')}
          </Button>
        </div>
      </div>
    </Card>
  );
}
