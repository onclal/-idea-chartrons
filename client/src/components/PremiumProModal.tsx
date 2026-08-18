import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  PREMIUM_PRO_MONTHLY_EUR,
  merchantTierPatch,
  type ActeurLocal,
} from '@idea-chartrons/shared';
import { Button, Modal } from './ui';
import { CheckoutModal, type CheckoutItem } from './CheckoutModal';
import { useToast } from '../context/ToastContext';
import { api } from '../lib/api';
import { formatEuro } from '../lib/format';

interface PremiumProModalProps {
  open: boolean;
  acteur: ActeurLocal | null;
  onClose: () => void;
  onSubscribed: (acteur: ActeurLocal) => void;
}

export function PremiumProModal({ open, acteur, onClose, onSubscribed }: PremiumProModalProps) {
  const { t, i18n } = useTranslation();
  const { showToast } = useToast();
  const [checkoutOpen, setCheckoutOpen] = useState(false);
  const features = t('acteurs.premiumPro.features', { returnObjects: true }) as string[];

  const membershipItem: CheckoutItem | null = acteur
    ? {
        id: `pro-${acteur.id}`,
        title: t('acteurs.premiumPro.checkoutTitle', { name: acteur.nomCommerce }),
        price: PREMIUM_PRO_MONTHLY_EUR,
        sellerName: 'IDÉA Chartrons',
        icon: '⭐',
        kind: 'membership',
      }
    : null;

  const handleClose = () => {
    setCheckoutOpen(false);
    onClose();
  };

  return (
    <>
      <Modal open={open && !checkoutOpen} onClose={handleClose} title={t('acteurs.premiumPro.title')}>
        <div className="space-y-4">
          <p className="text-sm text-chartrons-olive-dark leading-relaxed">{t('acteurs.premiumPro.intro')}</p>
          <ul className="space-y-2">
            {(Array.isArray(features) ? features : []).map((feature) => (
              <li key={feature} className="flex gap-2 text-sm text-chartrons-olive-dark">
                <span aria-hidden>✦</span>
                <span>{feature}</span>
              </li>
            ))}
          </ul>
          <p className="text-base font-bold text-chartrons-bordeaux">
            {t('acteurs.premiumPro.price', { price: formatEuro(PREMIUM_PRO_MONTHLY_EUR, i18n.language) })}
          </p>
          <p className="text-xs text-chartrons-warm-gray">{t('acteurs.premiumPro.simulation')}</p>
          <Button type="button" variant="gold" className="w-full" disabled={!acteur} onClick={() => setCheckoutOpen(true)}>
            {t('acteurs.premiumPro.subscribe')}
          </Button>
        </div>
      </Modal>

      <CheckoutModal
        open={checkoutOpen}
        item={membershipItem}
        nested
        onClose={() => setCheckoutOpen(false)}
        onConfirm={async () => {
          if (!acteur) return;
          const updated = await api.updateActeur(acteur.id, merchantTierPatch('premium_pro'));
          showToast(t('toast.premiumProActivated', { name: updated.nomCommerce }));
          setCheckoutOpen(false);
          onSubscribed(updated);
          onClose();
        }}
      />
    </>
  );
}
