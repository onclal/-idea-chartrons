import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  acteurHasAppointment,
  merchantActionModule,
  merchantWebsiteUrl,
  sanitizeExternalUrl,
  type ActeurLocal,
} from '@idea-chartrons/shared';
import { Button } from './ui';
import { WebsiteButton } from './WebsiteButton';
import { OrderModal, type OrderIntent } from './OrderModal';
import { CheckoutModal, type CheckoutItem } from './CheckoutModal';
import { useToast } from '../context/ToastContext';

interface MerchantActionButtonsProps {
  acteur: ActeurLocal;
}

export function MerchantActionButtons({ acteur }: MerchantActionButtonsProps) {
  const { t } = useTranslation();
  const { showToast } = useToast();
  const [orderOpen, setOrderOpen] = useState(false);
  const [orderIntent, setOrderIntent] = useState<OrderIntent>('collect');
  const [checkoutItem, setCheckoutItem] = useState<CheckoutItem | null>(null);
  const module = merchantActionModule(acteur);
  const website = merchantWebsiteUrl(acteur);
  const appointmentHref = sanitizeExternalUrl(acteur.appointmentUrl);

  if (!website && !module) return null;

  const openOrder = (intent: OrderIntent) => {
    setOrderIntent(intent);
    setOrderOpen(true);
  };

  const openExternal = (url: string) => {
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  return (
    <div className="mt-3 space-y-2" onClick={(event) => event.stopPropagation()}>
      {website && <WebsiteButton href={website} />}

      {module === 'book_table' && (
        <>
          <Button type="button" variant="bordeaux" className="w-full" onClick={() => openOrder('table')}>
            {t('acteurs.bookTable.cta')}
          </Button>
          {appointmentHref ? (
            <Button type="button" variant="ghost" className="w-full" onClick={() => openExternal(appointmentHref)}>
              {t('acteurs.bookTable.external')}
            </Button>
          ) : null}
        </>
      )}

      {module === 'book_appointment' && (
        <>
          <Button type="button" variant="bordeaux" className="w-full" onClick={() => openOrder('appointment')}>
            {t('acteurs.appointment.cta')}
          </Button>
          {appointmentHref && acteurHasAppointment(acteur) ? (
            <Button type="button" variant="ghost" className="w-full" onClick={() => openExternal(appointmentHref)}>
              {t('acteurs.appointment.external')}
            </Button>
          ) : null}
        </>
      )}

      {module === 'click_collect' && (
        <Button type="button" variant="primary" className="w-full" onClick={() => openOrder('collect')}>
          {t('acteurs.clickCollect.cta')}
        </Button>
      )}

      <OrderModal
        open={orderOpen}
        onClose={() => setOrderOpen(false)}
        acteur={acteur}
        intent={orderIntent}
        onReadyForCheckout={(details) => {
          const titleKey =
            details.intent === 'table'
              ? 'acteurs.bookTable.title'
              : details.intent === 'appointment'
                ? 'acteurs.appointment.title'
                : 'acteurs.clickCollect.title';
          setCheckoutItem({
            id: `${acteur.id}-${details.intent}-${Date.now()}`,
            title: t(titleKey, { name: acteur.nomCommerce }),
            price: 0,
            sellerName: acteur.nomCommerce,
            icon: details.intent === 'table' ? '🍽️' : details.intent === 'appointment' ? '🗓️' : '🛍️',
            kind: 'booking',
          });
        }}
      />

      <CheckoutModal
        open={!!checkoutItem}
        item={checkoutItem}
        onClose={() => setCheckoutItem(null)}
        onConfirm={(_item, _total, orderId) => {
          showToast(t('toast.purchaseConfirmed', { orderId }));
        }}
      />
    </div>
  );
}
