import { lazy, Suspense, useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Button, Card } from './ui';
import { useToast } from '../context/ToastContext';
import {
  loadArrivedStops,
  markStopArrived,
  resetArrivedStops,
  safeCheckInRouteKey,
  type SafeCheckInStop,
} from '../lib/safeCheckIn';
import { appUrl, shareOrCopy } from '../lib/share';
import { smsShareHref, whatsappShareHref } from '../lib/merchantProfile';
import type { MapPin } from './NeighborhoodMap';

const NeighborhoodMap = lazy(() =>
  import('./NeighborhoodMap').then((mod) => ({ default: mod.NeighborhoodMap })),
);

interface SafeCheckInProps {
  stops: SafeCheckInStop[];
  routeName?: string;
  sharePath?: string;
  showMap?: boolean;
}

export function SafeCheckIn({
  stops,
  routeName,
  sharePath = '/carte?parcours=1',
  showMap = false,
}: SafeCheckInProps) {
  const { t } = useTranslation();
  const { showToast } = useToast();
  const geoStops = stops.filter(
    (stop): stop is SafeCheckInStop & { latitude: number; longitude: number } =>
      stop.latitude != null && stop.longitude != null,
  );
  const routeKey = useMemo(() => safeCheckInRouteKey(stops.map((stop) => stop.id)), [stops]);
  const [arrived, setArrived] = useState(() => loadArrivedStops(routeKey));
  const [selectedId, setSelectedId] = useState<string | null>(geoStops[0]?.id ?? null);

  useEffect(() => {
    setArrived(loadArrivedStops(routeKey));
  }, [routeKey]);

  if (stops.length === 0) return null;

  const arrivedSet = new Set(arrived);
  const nextStop = stops.find((stop) => !arrivedSet.has(stop.id));
  const done = !nextStop;
  const shareUrl = appUrl(sharePath);
  const progressLine = done
    ? t('checkin.doneShare')
    : t('checkin.progressShare', {
        current: arrived.length + 1,
        total: stops.length,
        name: nextStop.title,
      });
  const shareText = [
    routeName ? `${routeName}` : t('checkin.title'),
    progressLine,
    ...stops.map((stop, index) => {
      const mark = arrivedSet.has(stop.id) ? '✓' : `${index + 1}.`;
      return `${mark} ${stop.title} — ${stop.adresse}`;
    }),
    shareUrl,
  ].join('\n');

  const handleShare = async () => {
    const result = await shareOrCopy({
      title: routeName ?? t('checkin.title'),
      text: shareText,
      url: shareUrl,
    });
    if (result === 'copied') showToast(t('share.copied'));
    if (result === 'failed') showToast(t('share.failed'), 'error');
  };

  const handleArrive = (stopId: string) => {
    const next = markStopArrived(routeKey, stopId);
    setArrived(next);
    showToast(t('checkin.arrivedToast'));
  };

  const handleReset = () => {
    resetArrivedStops(routeKey);
    setArrived([]);
  };

  const pins: MapPin[] = geoStops.map((stop) => ({
    id: stop.id,
    kind: 'commerce',
    title: stop.title,
    subtitle: t('checkin.stopLabel'),
    adresse: stop.adresse,
    latitude: stop.latitude,
    longitude: stop.longitude,
  }));
  const route = geoStops.map((stop) => [stop.latitude, stop.longitude] as [number, number]);
  const stopNumbers = Object.fromEntries(geoStops.map((stop, index) => [stop.id, index + 1]));

  return (
    <section id="safe-check-in">
    <Card className="!p-4 space-y-3">
      <div>
        <h3 className="font-bold text-chartrons-bordeaux">{t('checkin.title')}</h3>
        <p className="text-sm text-chartrons-warm-gray mt-1 leading-relaxed">{t('checkin.subtitle')}</p>
      </div>

      {showMap && pins.length > 0 && (
        <div className="h-48 overflow-hidden rounded-2xl border border-chartrons-beige">
          <Suspense fallback={<div className="h-full bg-chartrons-beige/40 animate-pulse" />}>
            <NeighborhoodMap
              pins={pins}
              selectedId={selectedId}
              onSelect={setSelectedId}
              locateToken={0}
              onLocated={() => undefined}
              onLocateError={() => undefined}
              route={route}
              stopNumbers={stopNumbers}
            />
          </Suspense>
        </div>
      )}

      <p className="text-sm font-semibold text-chartrons-olive-dark">
        {done
          ? t('checkin.complete')
          : t('checkin.progress', { current: arrived.length + 1, total: stops.length, name: nextStop.title })}
      </p>

      <ol className="space-y-2">
        {stops.map((stop, index) => {
          const isArrived = arrivedSet.has(stop.id);
          const isCurrent = nextStop?.id === stop.id;
          return (
            <li
              key={stop.id}
              className={`rounded-2xl border px-3 py-3 ${
                isArrived
                  ? 'border-chartrons-green/40 bg-chartrons-green/8'
                  : isCurrent
                    ? 'border-chartrons-brass bg-chartrons-brass/10'
                    : 'border-chartrons-beige'
              }`}
            >
              <div className="flex items-start gap-3">
                <span className="shrink-0 w-8 h-8 rounded-full bg-chartrons-green text-white text-sm font-bold flex items-center justify-center">
                  {isArrived ? '✓' : index + 1}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="font-semibold text-chartrons-olive-dark leading-snug">{stop.title}</p>
                  <p className="text-xs text-chartrons-warm-gray mt-0.5">📍 {stop.adresse}</p>
                </div>
              </div>
              {!isArrived && (
                <Button
                  type="button"
                  variant={isCurrent ? 'bordeaux' : 'secondary'}
                  className="w-full mt-3 min-h-[48px]"
                  onClick={() => handleArrive(stop.id)}
                >
                  {t('checkin.arrive')}
                </Button>
              )}
            </li>
          );
        })}
      </ol>

      <div className="flex flex-col gap-2">
        <Button type="button" variant="bordeaux" className="w-full" onClick={() => void handleShare()}>
          {t('checkin.share')}
        </Button>
        <div className="grid grid-cols-2 gap-2">
          <a
            href={whatsappShareHref(shareText)}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center justify-center min-h-[44px] px-3 rounded-xl bg-chartrons-green text-white text-sm font-semibold"
          >
            {t('checkin.whatsapp')}
          </a>
          <a
            href={smsShareHref(shareText)}
            className="inline-flex items-center justify-center min-h-[44px] px-3 rounded-xl bg-white border border-chartrons-beige text-sm font-semibold text-chartrons-olive-dark"
          >
            {t('checkin.sms')}
          </a>
        </div>
        {arrived.length > 0 && (
          <Button type="button" variant="ghost" className="w-full" onClick={handleReset}>
            {t('checkin.reset')}
          </Button>
        )}
      </div>
    </Card>
    </section>
  );
}
