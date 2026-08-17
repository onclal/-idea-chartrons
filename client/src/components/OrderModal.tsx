import { useEffect, useState, type FormEvent } from 'react';
import { useTranslation } from 'react-i18next';
import { merchantOrderPhone, type ActeurLocal } from '@idea-chartrons/shared';
import { Button, Input, Modal, Textarea } from './ui';
import { useToast } from '../context/ToastContext';
import { buildSmsHref, buildWhatsAppHref } from '../lib/phone';

interface OrderModalProps {
  open: boolean;
  onClose: () => void;
  acteur: ActeurLocal;
}

function defaultPickupTime(): string {
  return '12:30';
}

function buildOrderMessage(input: {
  merchantName: string;
  clientName: string;
  clientPhone: string;
  pickupTime: string;
  orderDetails: string;
}): string {
  return [
    `Bonjour ${input.merchantName},`,
    '',
    'Nouvelle demande Click & Collect (IDÉA Chartrons)',
    `Nom : ${input.clientName}`,
    `Téléphone : ${input.clientPhone}`,
    `Heure de retrait : ${input.pickupTime}`,
    '',
    'Commande :',
    input.orderDetails,
    '',
    'Règlement sur place.',
  ].join('\n');
}

export function OrderModal({ open, onClose, acteur }: OrderModalProps) {
  const { t } = useTranslation();
  const { showToast } = useToast();
  const [clientName, setClientName] = useState('');
  const [clientPhone, setClientPhone] = useState('');
  const [pickupTime, setPickupTime] = useState(defaultPickupTime);
  const [orderDetails, setOrderDetails] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    if (!open) return;
    setClientName('');
    setClientPhone('');
    setPickupTime(defaultPickupTime());
    setOrderDetails('');
    setError('');
  }, [open, acteur.id]);

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault();
    const name = clientName.trim();
    const phone = clientPhone.trim();
    const time = pickupTime.trim();
    const details = orderDetails.trim();
    if (!name || !phone || !time || !details) {
      setError(t('acteurs.clickCollect.required'));
      return;
    }

    const merchantPhone = merchantOrderPhone(acteur);
    if (!merchantPhone) {
      setError(t('acteurs.clickCollect.noPhone'));
      return;
    }

    const message = buildOrderMessage({
      merchantName: acteur.nomCommerce,
      clientName: name,
      clientPhone: phone,
      pickupTime: time,
      orderDetails: details,
    });
    const whatsapp = buildWhatsAppHref(merchantPhone, message);
    const sms = buildSmsHref(merchantPhone, message);
    const href = whatsapp ?? sms;
    if (!href) {
      setError(t('acteurs.clickCollect.noPhone'));
      return;
    }

    window.open(href, '_blank', 'noopener,noreferrer');
    showToast(t('acteurs.clickCollect.sent', { name: acteur.nomCommerce }));
    onClose();
  };

  return (
    <Modal open={open} onClose={onClose} title={t('acteurs.clickCollect.title', { name: acteur.nomCommerce })}>
      <form onSubmit={handleSubmit} className="space-y-4">
        <p className="text-sm text-chartrons-olive-dark/80 leading-relaxed bg-chartrons-beige/60 border border-chartrons-beige rounded-xl px-3 py-2.5">
          {t('acteurs.clickCollect.disclaimer')}
        </p>
        <Input
          label={t('acteurs.clickCollect.clientName')}
          value={clientName}
          onChange={(event) => {
            setClientName(event.target.value);
            setError('');
          }}
          autoComplete="name"
          placeholder={t('acteurs.clickCollect.clientNamePlaceholder')}
          required
        />
        <Input
          label={t('acteurs.clickCollect.clientPhone')}
          value={clientPhone}
          onChange={(event) => {
            setClientPhone(event.target.value);
            setError('');
          }}
          type="tel"
          inputMode="tel"
          autoComplete="tel"
          placeholder="06 12 34 56 78"
          required
        />
        <Input
          label={t('acteurs.clickCollect.pickupTime')}
          value={pickupTime}
          onChange={(event) => {
            setPickupTime(event.target.value);
            setError('');
          }}
          type="time"
          required
        />
        <Textarea
          label={t('acteurs.clickCollect.orderDetails')}
          value={orderDetails}
          onChange={(event) => {
            setOrderDetails(event.target.value);
            setError('');
          }}
          placeholder={t('acteurs.clickCollect.orderPlaceholder')}
          rows={4}
          required
        />
        {error ? <p className="text-sm text-chartrons-brick">{error}</p> : null}
        <Button type="submit" variant="primary" className="w-full">
          {t('acteurs.clickCollect.submit')}
        </Button>
      </form>
    </Modal>
  );
}
