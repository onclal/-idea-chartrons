import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  DEFAULT_TRANSACTION_FEE_EUR,
  computeCheckoutTotal,
  haversineMeters,
} from '@idea-chartrons/shared';
import { Button, Modal, Textarea } from './ui';
import { AudioReader } from './AudioReader';
import { QrCodeDisplay } from './QrCodeDisplay';
import { useConfort } from '../context/ConfortContext';
import { useConciergePanel } from '../context/ConciergePanelContext';
import { useUserLocation } from '../context/UserLocationContext';
import { api } from '../lib/api';
import { formatEuro } from '../lib/format';
import {
  type ConciergeOrderLine,
  type ConciergeOrderShop,
} from '../lib/concierge';
import { formatWalkingItinerary, walkingDirectionsUrl, walkingEtaMinutes } from '../lib/itinerary';
import { saveReceipt } from '../lib/receipts';

export type { ConciergeOrderLine, ConciergeOrderShop };

type OrderStep = 'fulfillment' | 'details' | 'recap' | 'ticket';
type FulfillmentMode = 'pickup' | 'delivery';

interface ConciergeOrderModalProps {
  open: boolean;
  shop: ConciergeOrderShop | null;
  lines: ConciergeOrderLine[];
  nested?: boolean;
  onClose: () => void;
}

function createOrderId() {
  return `CMD-CHARTRONS-${String(Date.now()).slice(-4)}`;
}

function ticketQrValue(orderId: string, shop: ConciergeOrderShop, mode: FulfillmentMode) {
  return `IDEA-CHARTRONS|${orderId}|${mode}|${shop.poiId}|${shop.name}`;
}

export function ConciergeOrderModal({
  open,
  shop,
  lines,
  nested = true,
  onClose,
}: ConciergeOrderModalProps) {
  const { t, i18n } = useTranslation();
  const { isConfortMode } = useConfort();
  const { closePanel } = useConciergePanel();
  const { origin } = useUserLocation();
  const [step, setStep] = useState<OrderStep>('fulfillment');
  const [mode, setMode] = useState<FulfillmentMode | null>(null);
  const [deliveryAddress, setDeliveryAddress] = useState('');
  const [inNeighborhood, setInNeighborhood] = useState(false);
  const [deliveryError, setDeliveryError] = useState('');
  const [paying, setPaying] = useState(false);
  const [orderId, setOrderId] = useState<string | null>(null);
  const [transactionFee, setTransactionFee] = useState(DEFAULT_TRANSACTION_FEE_EUR);

  const locale = i18n.language;
  const products = lines.length > 0 ? lines : shop ? [{ name: shop.name, quantity: '1', price: 12 }] : [];
  const subtotal = products.reduce((sum, line) => sum + line.price, 0);
  const checkout = computeCheckoutTotal(subtotal, transactionFee);
  const total = checkout.total;

  const walkMeters = useMemo(() => {
    if (!shop) return 0;
    if (typeof shop.distanceMeters === 'number' && Number.isFinite(shop.distanceMeters)) {
      return shop.distanceMeters;
    }
    return haversineMeters(origin, {
      latitude: shop.coordinates.lat,
      longitude: shop.coordinates.lng,
    });
  }, [origin, shop]);

  const walkLabel = formatWalkingItinerary(walkMeters, locale);
  const walkMinutes = walkingEtaMinutes(walkMeters);
  const mapsUrl = shop
    ? walkingDirectionsUrl({
        latitude: shop.coordinates.lat,
        longitude: shop.coordinates.lng,
      })
    : null;
  const mapPath = shop ? `/carte?pin=${encodeURIComponent(shop.poiId)}` : '/carte';

  useEffect(() => {
    if (!open) return;
    setStep('fulfillment');
    setMode(null);
    setDeliveryAddress('');
    setInNeighborhood(false);
    setDeliveryError('');
    setPaying(false);
    setOrderId(null);
    api
      .getPlatformSettings()
      .then((settings) => setTransactionFee(settings.transactionFee))
      .catch(() => setTransactionFee(DEFAULT_TRANSACTION_FEE_EUR));
  }, [open, shop?.poiId]);

  if (!shop) return null;

  const modeLabel =
    mode === 'delivery' ? t('conciergerie.order.modeDelivery') : t('conciergerie.order.modePickup');

  const listenText = (() => {
    const productText = products
      .map((line) => `${line.name}${line.quantity ? ` (${line.quantity})` : ''}`)
      .join(', ');
    if (step === 'ticket' && orderId) {
      return [
        t('conciergerie.order.ticketTitle'),
        t('conciergerie.order.orderId'),
        orderId,
        shop.name,
        modeLabel,
        t('conciergerie.order.total'),
        formatEuro(total, locale),
        mode === 'delivery' ? t('conciergerie.order.ticketHintDelivery') : t('conciergerie.order.ticketHintPickup'),
      ].join('. ');
    }
    if (step === 'recap') {
      return [
        t('conciergerie.order.recapTitle'),
        shop.name,
        t('conciergerie.order.products'),
        productText,
        t('conciergerie.order.mode'),
        modeLabel,
        mode === 'delivery' ? deliveryAddress.trim() : walkLabel,
        t('conciergerie.order.total'),
        formatEuro(total, locale),
      ].join('. ');
    }
    if (step === 'details' && mode === 'pickup') {
      return `${t('conciergerie.order.walkTitle')}. ${walkLabel}. ${shop.address}`;
    }
    if (step === 'details' && mode === 'delivery') {
      return `${t('conciergerie.order.deliveryTitle')}. ${t('conciergerie.order.deliveryConfirm')}`;
    }
    return `${t('conciergerie.order.fulfillmentTitle')} ${shop.name}`;
  })();

  const title =
    step === 'ticket'
      ? t('conciergerie.order.ticketTitle')
      : step === 'recap'
        ? t('conciergerie.order.recapTitle')
        : t('conciergerie.order.title', { name: shop.name });

  const ctaClass = `concierge-order-cta w-full ${isConfortMode ? 'text-xl font-extrabold min-h-[72px]' : ''}`;
  const typeClass = isConfortMode ? 'text-xl leading-relaxed' : 'text-sm';

  const handleClose = () => {
    setOrderId(null);
    onClose();
  };

  const chooseMode = (next: FulfillmentMode) => {
    setMode(next);
    setDeliveryError('');
    setStep('details');
  };

  const confirmDetails = () => {
    if (mode === 'delivery') {
      if (!deliveryAddress.trim() || !inNeighborhood) {
        setDeliveryError(t('conciergerie.order.deliveryRequired'));
        return;
      }
    }
    setDeliveryError('');
    setStep('recap');
  };

  const handlePay = () => {
    const fulfillment = mode;
    if (paying || !fulfillment) return;
    setPaying(true);
    window.setTimeout(() => {
      const nextOrderId = createOrderId();
      saveReceipt({
        orderId: nextOrderId,
        shopName: shop.name,
        shopId: shop.poiId,
        source: 'concierge',
        fulfillment,
        paymentStatus: 'paid',
        total,
        lines: products.map((line) => ({
          name: line.name,
          quantity: line.quantity,
          price: line.price,
        })),
        qrValue: ticketQrValue(nextOrderId, shop, fulfillment),
        deliveryAddress: fulfillment === 'delivery' ? deliveryAddress.trim() : undefined,
        walkingMeters: fulfillment === 'pickup' ? walkMeters : undefined,
      });
      setOrderId(nextOrderId);
      setPaying(false);
      setStep('ticket');
    }, 700);
  };

  const openMap = () => {
    handleClose();
    closePanel();
  };

  return (
    <Modal
      open={open}
      onClose={handleClose}
      title={title}
      nested={nested}
      size={isConfortMode ? 'lg' : 'md'}
      className={isConfortMode ? 'concierge-order-shell' : ''}
    >
      <div className={isConfortMode ? 'space-y-5 concierge-order-shell' : 'space-y-4'}>
        {(isConfortMode || step === 'recap' || step === 'ticket') && (
          <AudioReader text={listenText} className={`w-full ${isConfortMode ? 'text-xl font-extrabold' : ''}`} />
        )}

        {step === 'fulfillment' && (
          <>
            <p className={`${typeClass} font-semibold text-chartrons-olive-dark`}>
              {t('conciergerie.order.fulfillmentTitle')}
            </p>
            <button type="button" className={`${ctaClass} rounded-2xl bg-chartrons-green text-white px-4 py-4 text-left`} onClick={() => chooseMode('pickup')}>
              <span className="block">{t('conciergerie.order.pickup')}</span>
              <span className={`block mt-1 font-medium opacity-90 ${isConfortMode ? 'text-lg' : 'text-xs'}`}>
                {t('conciergerie.order.pickupHint')}
              </span>
            </button>
            <button type="button" className={`${ctaClass} rounded-2xl bg-chartrons-bordeaux text-white px-4 py-4 text-left`} onClick={() => chooseMode('delivery')}>
              <span className="block">{t('conciergerie.order.delivery')}</span>
              <span className={`block mt-1 font-medium opacity-90 ${isConfortMode ? 'text-lg' : 'text-xs'}`}>
                {shop.hasDelivery === false
                  ? t('conciergerie.order.deliveryPendingHint')
                  : t('conciergerie.order.deliveryHint')}
              </span>
            </button>
          </>
        )}

        {step === 'details' && mode === 'pickup' && (
          <>
            <p className={`${typeClass} font-semibold text-chartrons-olive-dark`}>
              {t('conciergerie.order.walkTitle')}
            </p>
            <div className="rounded-2xl border-2 border-chartrons-green bg-chartrons-stone/50 px-4 py-4 text-center">
              <p className={`${isConfortMode ? 'text-3xl' : 'text-2xl'} font-extrabold text-chartrons-green-dark`}>
                {walkLabel}
              </p>
              <p className={`${typeClass} text-chartrons-warm-gray mt-1`}>{shop.address}</p>
            </div>
            <div className={`grid gap-2 ${isConfortMode ? 'grid-cols-1' : 'grid-cols-2'}`}>
              <Link
                to={mapPath}
                onClick={openMap}
                className={`${ctaClass} inline-flex items-center justify-center rounded-2xl bg-chartrons-brass text-chartrons-olive-dark px-4 py-3 font-bold`}
              >
                🗺️ {t('conciergerie.order.mapLink')}
              </Link>
              {mapsUrl && (
                <a
                  href={mapsUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={`${ctaClass} inline-flex items-center justify-center rounded-2xl bg-white border-2 border-chartrons-olive text-chartrons-olive-dark px-4 py-3 font-bold`}
                >
                  🚶 {t('conciergerie.order.mapsLink')}
                </a>
              )}
            </div>
            <p className={`${isConfortMode ? 'text-base' : 'text-xs'} text-chartrons-warm-gray`}>
              {t('conciergerie.order.walkEtaHint', { minutes: walkMinutes })}
            </p>
            <Button type="button" variant="primary" className={ctaClass} onClick={confirmDetails}>
              {t('conciergerie.order.confirmWalk')}
            </Button>
            <Button type="button" variant="ghost" className={ctaClass} onClick={() => setStep('fulfillment')}>
              {t('conciergerie.order.back')}
            </Button>
          </>
        )}

        {step === 'details' && mode === 'delivery' && (
          <>
            <p className={`${typeClass} font-semibold text-chartrons-olive-dark`}>
              {t('conciergerie.order.deliveryTitle')}
            </p>
            <Textarea
              label={t('conciergerie.order.deliveryAddress')}
              value={deliveryAddress}
              onChange={(event) => setDeliveryAddress(event.target.value)}
              placeholder={t('conciergerie.order.deliveryPlaceholder')}
              rows={isConfortMode ? 4 : 3}
            />
            <label className={`flex items-start gap-3 ${typeClass} text-chartrons-olive-dark`}>
              <input
                type="checkbox"
                checked={inNeighborhood}
                onChange={(event) => setInNeighborhood(event.target.checked)}
                className="mt-1 h-6 w-6 rounded border-chartrons-beige"
              />
              <span>{t('conciergerie.order.deliveryConfirm')}</span>
            </label>
            {deliveryError && (
              <p className={`${typeClass} font-semibold text-chartrons-bordeaux`}>{deliveryError}</p>
            )}
            <Button type="button" variant="bordeaux" className={ctaClass} onClick={confirmDetails}>
              {t('conciergerie.order.continue')}
            </Button>
            <Button type="button" variant="ghost" className={ctaClass} onClick={() => setStep('fulfillment')}>
              {t('conciergerie.order.back')}
            </Button>
          </>
        )}

        {step === 'recap' && mode && (
          <>
            <div className="rounded-2xl border border-chartrons-beige bg-chartrons-beige/40 p-4 space-y-3">
              <div>
                <p className={`${isConfortMode ? 'text-base' : 'text-xs'} uppercase tracking-wide text-chartrons-warm-gray`}>
                  {t('conciergerie.order.shop')}
                </p>
                <p className={`${isConfortMode ? 'text-2xl' : 'text-base'} font-bold text-chartrons-olive-dark`}>
                  {shop.name}
                </p>
              </div>
              <div>
                <p className={`${isConfortMode ? 'text-base' : 'text-xs'} uppercase tracking-wide text-chartrons-warm-gray`}>
                  {t('conciergerie.order.products')}
                </p>
                <ul className="mt-1 space-y-1">
                  {products.map((line) => (
                    <li key={`${line.name}-${line.quantity ?? ''}`} className={`flex justify-between gap-3 ${typeClass}`}>
                      <span>
                        {line.name}
                        {line.quantity ? ` · ${line.quantity}` : ''}
                      </span>
                      <span className="font-semibold shrink-0">{formatEuro(line.price, locale)}</span>
                    </li>
                  ))}
                </ul>
              </div>
              <div>
                <p className={`${isConfortMode ? 'text-base' : 'text-xs'} uppercase tracking-wide text-chartrons-warm-gray`}>
                  {t('conciergerie.order.mode')}
                </p>
                <p className={`${typeClass} font-semibold text-chartrons-olive-dark`}>{modeLabel}</p>
                <p className={`${isConfortMode ? 'text-lg' : 'text-xs'} text-chartrons-warm-gray mt-0.5`}>
                  {mode === 'delivery' ? deliveryAddress.trim() : `${t('conciergerie.order.pickupAt', { name: shop.name })} · ${walkLabel}`}
                </p>
              </div>
              <div className="flex items-center justify-between gap-3 pt-2 border-t border-chartrons-beige">
                <p className={`${isConfortMode ? 'text-xl' : 'text-sm'} font-semibold text-chartrons-olive-dark`}>
                  {t('conciergerie.order.total')}
                </p>
                <p className={`${isConfortMode ? 'text-2xl' : 'text-lg'} font-extrabold text-chartrons-bordeaux`}>
                  {formatEuro(total, locale)}
                </p>
              </div>
            </div>
            <p className={`${isConfortMode ? 'text-base' : 'text-xs'} text-chartrons-warm-gray`}>
              {t('conciergerie.order.demoHint')}
            </p>
            <Button type="button" variant="bordeaux" className={ctaClass} disabled={paying} onClick={handlePay}>
              {paying ? t('conciergerie.order.paying') : t('conciergerie.order.pay')}
            </Button>
            {!isConfortMode && (
              <Button type="button" variant="ghost" className="w-full" onClick={() => setStep('details')}>
                {t('conciergerie.order.back')}
              </Button>
            )}
            {isConfortMode && (
              <Button type="button" variant="ghost" className={ctaClass} onClick={() => setStep('details')}>
                {t('conciergerie.order.back')}
              </Button>
            )}
          </>
        )}

        {step === 'ticket' && orderId && mode && (
          <div className="space-y-4 text-center">
            <p className={`${isConfortMode ? 'text-2xl' : 'text-lg'} font-bold text-chartrons-olive-dark`}>
              {t('checkout.successTitle')}
            </p>
            <QrCodeDisplay
              value={ticketQrValue(orderId, shop, mode)}
              size={isConfortMode ? 200 : 160}
              label={t('conciergerie.order.qrLabel')}
            />
            <div className="rounded-2xl border border-chartrons-beige bg-chartrons-beige/40 px-4 py-3">
              <p className={`${isConfortMode ? 'text-base' : 'text-xs'} uppercase tracking-wide text-chartrons-warm-gray`}>
                {t('conciergerie.order.orderId')}
              </p>
              <p className={`${isConfortMode ? 'text-2xl' : 'text-base'} font-mono font-bold text-chartrons-bordeaux mt-1`}>
                {orderId}
              </p>
              <p className={`${typeClass} font-semibold text-chartrons-olive-dark mt-2`}>{shop.name}</p>
              <p className={`${isConfortMode ? 'text-lg' : 'text-sm'} text-chartrons-warm-gray mt-1`}>{modeLabel}</p>
              <p className={`${isConfortMode ? 'text-xl' : 'text-sm'} font-bold text-chartrons-olive-dark mt-2`}>
                {formatEuro(total, locale)}
              </p>
            </div>
            <p className={`${typeClass} text-chartrons-olive-dark leading-relaxed`}>
              {mode === 'delivery'
                ? t('conciergerie.order.ticketHintDelivery')
                : t('conciergerie.order.ticketHintPickup')}
            </p>
            <Button type="button" variant="bordeaux" className={ctaClass} onClick={handleClose}>
              {t('conciergerie.order.close')}
            </Button>
          </div>
        )}
      </div>
    </Modal>
  );
}
