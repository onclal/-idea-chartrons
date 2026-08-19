import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { QRCodeSVG } from 'qrcode.react';
import type { ActeurLocal } from '@idea-chartrons/shared';
import { Button, Select } from './ui';
import { useToast } from '../context/ToastContext';
import {
  QR_BG,
  QR_CTA_TEMPLATES,
  QR_DESTINATIONS,
  QR_FG,
  defaultCtaForDestination,
  downloadQrFlyerPng,
  downloadQrOnlyPng,
  qrTargetUrl,
  slugFilename,
  type QrCtaTemplate,
  type QrDestination,
} from '../lib/qrCode';

interface QRCodeGeneratorProps {
  acteur?: ActeurLocal | null;
  acteurs?: ActeurLocal[];
  defaultDestination?: QrDestination;
  className?: string;
}

export function QRCodeGenerator({
  acteur,
  acteurs = [],
  defaultDestination,
  className = '',
}: QRCodeGeneratorProps) {
  const { t } = useTranslation();
  const { showToast } = useToast();
  const [shopId, setShopId] = useState(acteur?.id ?? acteurs[0]?.id ?? '');
  const [destination, setDestination] = useState<QrDestination>(
    defaultDestination ?? (acteur || acteurs.length ? 'shop' : 'pepites'),
  );
  const [ctaId, setCtaId] = useState<QrCtaTemplate>(
    defaultCtaForDestination(defaultDestination ?? (acteur ? 'shop' : 'pepites')),
  );
  const [busy, setBusy] = useState<'png' | 'qr' | null>(null);

  const selectedShop = acteur ?? acteurs.find((item) => item.id === shopId) ?? null;
  const qrValue = qrTargetUrl(destination, selectedShop?.id);
  const shopName = selectedShop?.nomCommerce ?? t('app.name');
  const cta = t(`qrKit.templates.${ctaId}`);

  const destinations = useMemo(
    () => QR_DESTINATIONS.filter((item) => item !== 'shop' || selectedShop),
    [selectedShop],
  );

  const handleDestination = (next: QrDestination) => {
    setDestination(next);
    setCtaId(defaultCtaForDestination(next));
  };

  const run = async (kind: 'png' | 'qr', work: () => Promise<void>) => {
    setBusy(kind);
    try {
      await work();
      showToast(t('qrKit.downloaded'));
    } catch (err) {
      showToast(err instanceof Error ? err.message : t('common.error'), 'error');
    } finally {
      setBusy(null);
    }
  };

  return (
    <div className={`space-y-5 ${className}`}>
      <div>
        <h3 className="font-bold text-chartrons-green-dark">{t('qrKit.title')}</h3>
        <p className="text-xs text-chartrons-warm-gray mt-1 leading-relaxed">{t('qrKit.subtitle')}</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {!acteur && acteurs.length > 0 && (
          <Select
            label={t('qrKit.shop')}
            value={shopId}
            onChange={(event) => setShopId(event.target.value)}
            options={acteurs.map((item) => ({ value: item.id, label: item.nomCommerce }))}
          />
        )}
        <Select
          label={t('qrKit.destination')}
          value={destination}
          onChange={(event) => handleDestination(event.target.value as QrDestination)}
          options={destinations.map((item) => ({
            value: item,
            label: t(`qrKit.destinations.${item}`),
          }))}
        />
        <Select
          label={t('qrKit.cta')}
          value={ctaId}
          onChange={(event) => setCtaId(event.target.value as QrCtaTemplate)}
          options={QR_CTA_TEMPLATES.map((item) => ({
            value: item,
            label: t(`qrKit.templates.${item}`),
          }))}
        />
      </div>

      <div className="qr-flyer-print mx-auto w-full max-w-[20rem]">
        <article className="relative aspect-[105/148] rounded-[22px] border-[3px] border-chartrons-green bg-chartrons-stone px-5 py-6 text-center flex flex-col items-center shadow-card">
          <div className="absolute inset-[7px] rounded-[16px] border border-chartrons-brass/70 pointer-events-none" />
          <p className="text-[9px] font-bold uppercase tracking-[0.22em] text-chartrons-brass">
            {t('poster.kicker')}
          </p>
          <h4 className="mt-2 text-lg font-bold text-chartrons-green-dark leading-tight font-[family-name:var(--font-family-display)]">
            {shopName}
          </h4>
          <p className="mt-3 text-[13px] font-semibold text-chartrons-olive-dark leading-snug">{cta}</p>
          <div className="mt-4 p-2 bg-white rounded-xl border border-chartrons-beige shadow-sm">
            <QRCodeSVG value={qrValue} size={168} bgColor={QR_BG} fgColor={QR_FG} level="H" includeMargin />
          </div>
          <p className="mt-3 text-[9px] font-mono text-chartrons-warm-gray break-all leading-snug">{qrValue}</p>
          <p className="mt-auto pt-3 text-[10px] font-semibold uppercase tracking-wide text-chartrons-brass">
            {t('qrKit.footer')}
          </p>
        </article>
      </div>

      <div className="no-print grid grid-cols-1 sm:grid-cols-3 gap-2">
        <Button
          type="button"
          variant="bordeaux"
          disabled={busy !== null}
          onClick={() =>
            void run('png', () =>
              downloadQrFlyerPng({
                qrValue,
                kicker: t('poster.kicker'),
                shopName,
                cta,
                footer: t('qrKit.footer'),
                filename: `idea-chartrons-${slugFilename(shopName)}-a6.png`,
              }),
            )
          }
        >
          {busy === 'png' ? t('common.loading') : t('qrKit.downloadPng')}
        </Button>
        <Button
          type="button"
          variant="gold"
          className="no-print"
          onClick={() => window.print()}
        >
          {t('qrKit.printPdf')}
        </Button>
        <Button
          type="button"
          variant="secondary"
          disabled={busy !== null}
          onClick={() =>
            void run('qr', () =>
              downloadQrOnlyPng(qrValue, `idea-chartrons-${slugFilename(shopName)}-qr.png`),
            )
          }
        >
          {busy === 'qr' ? t('common.loading') : t('qrKit.downloadQr')}
        </Button>
      </div>
    </div>
  );
}
