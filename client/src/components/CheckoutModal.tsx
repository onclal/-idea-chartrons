import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { DEFAULT_TRANSACTION_FEE_EUR, computeCheckoutTotal } from '@idea-chartrons/shared';
import { Button, Input, Modal } from './ui';
import { api } from '../lib/api';
import { formatEuro } from '../lib/format';

export type CheckoutKind = 'post' | 'booking' | 'membership';

export interface CheckoutItem {
  id: string;
  title: string;
  imageUrl?: string | null;
  price: number;
  sellerName?: string | null;
  icon?: string;
  kind?: CheckoutKind;
}

interface CheckoutModalProps {
  open: boolean;
  item: CheckoutItem | null;
  nested?: boolean;
  onClose: () => void;
  onConfirm: (item: CheckoutItem, total: number, orderId: string) => void | Promise<void>;
}

function createOrderId() {
  return `CMD-CHARTRONS-${String(Date.now()).slice(-4)}`;
}

export function CheckoutModal({
  open,
  item,
  nested = false,
  onClose,
  onConfirm,
}: CheckoutModalProps) {
  const { t, i18n } = useTranslation();
  const [cardName, setCardName] = useState('');
  const [cardNumber, setCardNumber] = useState('');
  const [cardExpiry, setCardExpiry] = useState('');
  const [cardCvc, setCardCvc] = useState('');
  const [paying, setPaying] = useState(false);
  const [orderId, setOrderId] = useState<string | null>(null);
  const [transactionFee, setTransactionFee] = useState(DEFAULT_TRANSACTION_FEE_EUR);

  const price = item?.price ?? 0;
  const { total } = computeCheckoutTotal(price, transactionFee);
  const locale = i18n.language;
  const canPay =
    cardName.trim().length > 1 &&
    cardNumber.replace(/\s/g, '').length >= 12 &&
    cardExpiry.trim().length >= 4 &&
    cardCvc.trim().length >= 3;

  useEffect(() => {
    if (!open) return;
    setPaying(false);
    setOrderId(null);
    setCardName('Marie Dupont');
    setCardNumber('4242 4242 4242 4242');
    setCardExpiry('12/28');
    setCardCvc('123');
    api
      .getPlatformSettings()
      .then((settings) => setTransactionFee(settings.transactionFee))
      .catch(() => setTransactionFee(DEFAULT_TRANSACTION_FEE_EUR));
  }, [open, item?.id]);

  const handleClose = () => {
    setOrderId(null);
    onClose();
  };

  const handlePay = () => {
    if (!item || !canPay) return;
    setPaying(true);
    window.setTimeout(() => {
      const nextOrderId = createOrderId();
      setOrderId(nextOrderId);
      setPaying(false);
      void onConfirm(item, total, nextOrderId);
    }, 700);
  };

  const priceLabel =
    item?.kind === 'membership'
      ? t('checkout.membershipPrice')
      : item?.kind === 'booking'
        ? t('checkout.bookingPrice')
        : t('checkout.itemPrice');

  return (
    <Modal open={open} onClose={handleClose} title={t('checkout.title')} nested={nested}>
      {item && orderId ? (
        <div className="space-y-4 text-center">
          <p className="text-4xl" aria-hidden>
            ✅
          </p>
          <p className="text-lg font-bold text-chartrons-olive-dark">{t('checkout.successTitle')}</p>
          <p className="text-sm text-chartrons-warm-gray leading-relaxed">{t('checkout.successHint')}</p>
          <div className="rounded-xl border border-chartrons-beige bg-chartrons-beige/40 px-4 py-3">
            <p className="text-xs uppercase tracking-wide text-chartrons-warm-gray">{t('checkout.orderId')}</p>
            <p className="text-base font-mono font-bold text-chartrons-bordeaux mt-1">{orderId}</p>
            <p className="text-sm font-semibold text-chartrons-olive-dark mt-2">{formatEuro(total, locale)}</p>
          </div>
          <Button variant="bordeaux" className="w-full" onClick={handleClose}>
            {t('checkout.close')}
          </Button>
        </div>
      ) : item ? (
        <div className="space-y-4">
          <p className="text-sm text-chartrons-olive-dark leading-relaxed">{t('checkout.secureHint')}</p>

          <div className="flex gap-3 rounded-xl border border-chartrons-beige bg-white p-3">
            {item.imageUrl ? (
              <img
                src={item.imageUrl}
                alt=""
                className="w-16 h-16 rounded-lg object-cover shrink-0 bg-chartrons-beige"
              />
            ) : (
              <div className="w-16 h-16 rounded-lg bg-chartrons-beige shrink-0 flex items-center justify-center text-xl">
                {item.icon ?? '🛒'}
              </div>
            )}
            <div className="min-w-0">
              <p className="text-sm font-semibold text-chartrons-olive-dark leading-snug">{item.title}</p>
              {item.sellerName ? (
                <p className="text-xs text-chartrons-warm-gray mt-1">
                  {t('checkout.seller', { name: item.sellerName })}
                </p>
              ) : null}
            </div>
          </div>

          <div className="rounded-xl border border-chartrons-beige bg-chartrons-beige/40 p-3">
            <dl className="space-y-1.5">
              <div className="flex items-center justify-between gap-3 text-sm">
                <dt className="text-chartrons-warm-gray">{priceLabel}</dt>
                <dd className="font-medium text-chartrons-olive-dark">{formatEuro(price, locale)}</dd>
              </div>
              <div className="flex items-center justify-between gap-3 text-sm">
                <dt className="text-chartrons-warm-gray">{t('checkout.protection')}</dt>
                <dd className="font-medium text-chartrons-olive-dark">+{formatEuro(transactionFee, locale)}</dd>
              </div>
              <div className="flex items-center justify-between gap-3 text-sm pt-1.5 border-t border-chartrons-beige">
                <dt className="font-semibold text-chartrons-olive-dark">{t('checkout.total')}</dt>
                <dd className="font-bold text-chartrons-bordeaux">{formatEuro(total, locale)}</dd>
              </div>
            </dl>
          </div>

          <div className="rounded-xl border border-chartrons-beige bg-white p-3 space-y-3">
            <p className="text-xs font-semibold uppercase tracking-wide text-chartrons-warm-gray">
              {t('checkout.cardTitle')}
            </p>
            <Input
              label={t('checkout.cardName')}
              value={cardName}
              onChange={(event) => setCardName(event.target.value)}
              autoComplete="off"
            />
            <Input
              label={t('checkout.cardNumber')}
              inputMode="numeric"
              value={cardNumber}
              onChange={(event) => setCardNumber(event.target.value)}
              autoComplete="off"
            />
            <div className="grid grid-cols-2 gap-3">
              <Input
                label={t('checkout.cardExpiry')}
                value={cardExpiry}
                onChange={(event) => setCardExpiry(event.target.value)}
                placeholder="MM/AA"
                autoComplete="off"
              />
              <Input
                label={t('checkout.cardCvc')}
                inputMode="numeric"
                value={cardCvc}
                onChange={(event) => setCardCvc(event.target.value)}
                autoComplete="off"
              />
            </div>
            <p className="text-[11px] text-chartrons-warm-gray">{t('checkout.demoHint')}</p>
          </div>

          <Button variant="bordeaux" className="w-full" disabled={paying || !canPay} onClick={handlePay}>
            {paying ? t('checkout.processing') : t('checkout.pay', { total: formatEuro(total, locale) })}
          </Button>
        </div>
      ) : null}
    </Modal>
  );
}
