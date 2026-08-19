import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Badge, Card } from './ui';
import { QrCodeDisplay } from './QrCodeDisplay';
import { formatEuro, formatDateTime } from '../lib/format';
import { formatWalkingItinerary } from '../lib/itinerary';
import type { ResidentReceipt } from '../lib/receipts';

interface ResidentReceiptsProps {
  receipts: ResidentReceipt[];
}

export function ResidentReceipts({ receipts }: ResidentReceiptsProps) {
  const { t, i18n } = useTranslation();
  const [openId, setOpenId] = useState<string | null>(receipts[0]?.id ?? null);
  const locale = i18n.language;

  if (receipts.length === 0) {
    return (
      <Card className="!p-4">
        <p className="text-sm text-chartrons-warm-gray">{t('carnet.receipts.empty')}</p>
      </Card>
    );
  }

  return (
    <div className="space-y-2">
      {receipts.map((receipt) => {
        const expanded = openId === receipt.id;
        return (
          <Card key={receipt.id} className="!p-0 overflow-hidden">
            <button
              type="button"
              className="w-full text-left px-4 py-3 flex items-start justify-between gap-3"
              onClick={() => setOpenId(expanded ? null : receipt.id)}
              aria-expanded={expanded}
            >
              <div className="min-w-0">
                <p className="text-sm font-semibold text-chartrons-olive-dark truncate">{receipt.shopName}</p>
                <p className="text-[11px] text-chartrons-warm-gray mt-0.5">
                  {formatDateTime(receipt.createdAt, locale)} · {receipt.orderId}
                </p>
              </div>
              <div className="text-right shrink-0 space-y-1">
                <p className="text-sm font-bold text-chartrons-bordeaux">{formatEuro(receipt.total, locale)}</p>
                <Badge variant={receipt.paymentStatus === 'paid' ? 'green' : 'stone'}>
                  {t(`carnet.receipts.status.${receipt.paymentStatus}`)}
                </Badge>
              </div>
            </button>

            {expanded && (
              <div className="px-4 pb-4 space-y-3 border-t border-chartrons-beige pt-3">
                <div className="flex flex-wrap gap-1.5">
                  <Badge variant="olive">{t(`carnet.receipts.fulfillment.${receipt.fulfillment}`)}</Badge>
                  <Badge variant="stone">{t(`carnet.receipts.source.${receipt.source}`)}</Badge>
                </div>

                <ul className="space-y-1">
                  {receipt.lines.map((line) => (
                    <li key={`${line.name}-${line.quantity ?? ''}`} className="flex justify-between gap-3 text-sm">
                      <span className="text-chartrons-olive-dark">
                        {line.name}
                        {line.quantity ? ` · ${line.quantity}` : ''}
                      </span>
                      <span className="font-semibold shrink-0">{formatEuro(line.price, locale)}</span>
                    </li>
                  ))}
                </ul>

                {receipt.fulfillment === 'delivery' && receipt.deliveryAddress && (
                  <p className="text-xs text-chartrons-warm-gray">{receipt.deliveryAddress}</p>
                )}
                {receipt.fulfillment === 'pickup' && receipt.walkingMeters != null && (
                  <p className="text-xs font-semibold text-chartrons-green">
                    🚶 {formatWalkingItinerary(receipt.walkingMeters, locale)}
                  </p>
                )}

                <div className="flex flex-col items-center gap-2 pt-1">
                  <QrCodeDisplay value={receipt.qrValue} size={140} label={t('carnet.receipts.qrLabel')} />
                  <p className="text-xs text-chartrons-warm-gray text-center leading-relaxed">
                    {receipt.fulfillment === 'delivery'
                      ? t('carnet.receipts.qrDeliveryHint')
                      : t('carnet.receipts.qrPickupHint')}
                  </p>
                </div>
              </div>
            )}
          </Card>
        );
      })}
    </div>
  );
}
