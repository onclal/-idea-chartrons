import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  acteurHasAppointment,
  canBookTable,
  canClickAndCollect,
  merchantActionModule,
  merchantOrderPhone,
  merchantWebsiteUrl,
  sanitizeExternalUrl,
  type ActeurLocal,
} from '@idea-chartrons/shared';
import { Button } from './ui';
import { WebsiteButton } from './WebsiteButton';
import { OrderModal } from './OrderModal';
import { toTelHref } from '../lib/phone';

interface MerchantActionButtonsProps {
  acteur: ActeurLocal;
}

export function MerchantActionButtons({ acteur }: MerchantActionButtonsProps) {
  const { t } = useTranslation();
  const [orderOpen, setOrderOpen] = useState(false);
  const module = merchantActionModule(acteur);
  const website = merchantWebsiteUrl(acteur);
  const appointmentHref = sanitizeExternalUrl(acteur.appointmentUrl);
  const phone = merchantOrderPhone(acteur);

  if (!website && !module) return null;

  const openExternal = (url: string) => {
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  return (
    <div className="mt-3 space-y-2" onClick={(event) => event.stopPropagation()}>
      {website && <WebsiteButton href={website} />}

      {module === 'book_table' && canBookTable(acteur) && (
        appointmentHref ? (
          <Button type="button" variant="bordeaux" className="w-full" onClick={() => openExternal(appointmentHref)}>
            {t('acteurs.bookTable.cta')}
          </Button>
        ) : (
          <Button type="button" variant="bordeaux" className="w-full" onClick={() => setOrderOpen(true)}>
            {t('acteurs.bookTable.cta')}
          </Button>
        )
      )}

      {module === 'book_appointment' && (
        appointmentHref && acteurHasAppointment(acteur) ? (
          <Button type="button" variant="bordeaux" className="w-full" onClick={() => openExternal(appointmentHref)}>
            {t('acteurs.appointment.cta')}
          </Button>
        ) : phone ? (
          <a
            href={toTelHref(phone)}
            className="inline-flex items-center justify-center w-full min-h-[44px] px-4 rounded-xl bg-chartrons-bordeaux text-white text-sm font-medium"
          >
            {t('acteurs.appointment.cta')}
          </a>
        ) : null
      )}

      {module === 'click_collect' && canClickAndCollect(acteur) && (
        <Button type="button" variant="primary" className="w-full" onClick={() => setOrderOpen(true)}>
          {t('acteurs.clickCollect.cta')}
        </Button>
      )}

      {(module === 'click_collect' || module === 'book_table') && (
        <OrderModal
          open={orderOpen}
          onClose={() => setOrderOpen(false)}
          acteur={acteur}
          intent={module === 'book_table' ? 'table' : 'collect'}
        />
      )}
    </div>
  );
}
