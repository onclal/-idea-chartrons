import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ONLINE_PAYMENT_FEE_EUR, type PostAnnonce } from '@idea-chartrons/shared';
import { Button, Input, Modal } from './ui';
import { formatEuro } from '../lib/format';

interface CheckoutModalProps {
  open: boolean;
  post: PostAnnonce | null;
  onClose: () => void;
  onConfirm: (post: PostAnnonce, total: number) => void;
}

export function CheckoutModal({ open, post, onClose, onConfirm }: CheckoutModalProps) {
  const { t, i18n } = useTranslation();
  const [cardName, setCardName] = useState('Marie Dupont');
  const [paying, setPaying] = useState(false);

  const price = post?.prix ?? 0;
  const fee = ONLINE_PAYMENT_FEE_EUR;
  const total = price + fee;
  const locale = i18n.language;

  const handlePay = () => {
    if (!post) return;
    setPaying(true);
    window.setTimeout(() => {
      setPaying(false);
      onConfirm(post, total);
      onClose();
    }, 700);
  };

  return (
    <Modal open={open} onClose={onClose} title={t('checkout.title')}>
      {post && (
        <div className="space-y-4">
          <p className="text-sm text-chartrons-olive-dark leading-relaxed">{t('checkout.secureHint')}</p>
          <p className="text-sm font-semibold text-chartrons-olive-dark">{post.titre}</p>

          <div className="rounded-xl border border-chartrons-beige bg-chartrons-beige/40 p-3">
            <dl className="space-y-1.5">
              <div className="flex items-center justify-between gap-3 text-sm">
                <dt className="text-chartrons-warm-gray">{t('checkout.itemPrice')}</dt>
                <dd className="font-medium text-chartrons-olive-dark">{formatEuro(price, locale)}</dd>
              </div>
              <div className="flex items-center justify-between gap-3 text-sm">
                <dt className="text-chartrons-warm-gray">{t('checkout.protection')}</dt>
                <dd className="font-medium text-chartrons-olive-dark">+{formatEuro(fee, locale)}</dd>
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
              value="4242 4242 4242 4242"
              readOnly
              className="bg-chartrons-beige/50"
            />
            <div className="grid grid-cols-2 gap-3">
              <Input label={t('checkout.cardExpiry')} value="12/28" readOnly className="bg-chartrons-beige/50" />
              <Input label={t('checkout.cardCvc')} value="123" readOnly className="bg-chartrons-beige/50" />
            </div>
            <p className="text-[11px] text-chartrons-warm-gray">{t('checkout.demoHint')}</p>
          </div>

          <Button variant="bordeaux" className="w-full" disabled={paying || !cardName.trim()} onClick={handlePay}>
            {paying ? t('checkout.processing') : t('checkout.pay', { total: formatEuro(total, locale) })}
          </Button>
        </div>
      )}
    </Modal>
  );
}
