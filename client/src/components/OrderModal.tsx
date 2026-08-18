import { useEffect, useState, type FormEvent } from 'react';
import { useTranslation } from 'react-i18next';
import type { ActeurLocal } from '@idea-chartrons/shared';
import { Button, Input, Modal, Textarea } from './ui';

export type OrderIntent = 'collect' | 'table' | 'appointment';

export interface OrderDetails {
  clientName: string;
  clientPhone: string;
  pickupTime: string;
  orderDetails: string;
  intent: OrderIntent;
}

interface OrderModalProps {
  open: boolean;
  onClose: () => void;
  acteur: ActeurLocal;
  intent?: OrderIntent;
  onReadyForCheckout: (details: OrderDetails) => void;
}

function defaultPickupTime(): string {
  return '12:30';
}

function copyKey(intent: OrderIntent, field: 'title' | 'disclaimer' | 'time' | 'details' | 'placeholder' | 'submit') {
  if (intent === 'table') {
    const map = {
      title: 'acteurs.bookTable.title',
      disclaimer: 'acteurs.bookTable.disclaimer',
      time: 'acteurs.bookTable.time',
      details: 'acteurs.bookTable.details',
      placeholder: 'acteurs.bookTable.placeholder',
      submit: 'acteurs.bookTable.submit',
    } as const;
    return map[field];
  }
  if (intent === 'appointment') {
    const map = {
      title: 'acteurs.appointment.title',
      disclaimer: 'acteurs.appointment.disclaimer',
      time: 'acteurs.appointment.time',
      details: 'acteurs.appointment.details',
      placeholder: 'acteurs.appointment.placeholder',
      submit: 'acteurs.appointment.submit',
    } as const;
    return map[field];
  }
  const map = {
    title: 'acteurs.clickCollect.title',
    disclaimer: 'acteurs.clickCollect.disclaimer',
    time: 'acteurs.clickCollect.pickupTime',
    details: 'acteurs.clickCollect.orderDetails',
    placeholder: 'acteurs.clickCollect.orderPlaceholder',
    submit: 'acteurs.clickCollect.submit',
  } as const;
  return map[field];
}

export function OrderModal({
  open,
  onClose,
  acteur,
  intent = 'collect',
  onReadyForCheckout,
}: OrderModalProps) {
  const { t } = useTranslation();
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
  }, [open, acteur.id, intent]);

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

    onReadyForCheckout({
      clientName: name,
      clientPhone: phone,
      pickupTime: time,
      orderDetails: details,
      intent,
    });
    onClose();
  };

  return (
    <Modal open={open} onClose={onClose} title={t(copyKey(intent, 'title'), { name: acteur.nomCommerce })}>
      <form onSubmit={handleSubmit} className="space-y-4">
        <p className="text-sm text-chartrons-olive-dark/80 leading-relaxed bg-chartrons-beige/60 border border-chartrons-beige rounded-xl px-3 py-2.5">
          {t(copyKey(intent, 'disclaimer'))}
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
          label={t(copyKey(intent, 'time'))}
          value={pickupTime}
          onChange={(event) => {
            setPickupTime(event.target.value);
            setError('');
          }}
          type="time"
          required
        />
        <Textarea
          label={t(copyKey(intent, 'details'))}
          value={orderDetails}
          onChange={(event) => {
            setOrderDetails(event.target.value);
            setError('');
          }}
          placeholder={t(copyKey(intent, 'placeholder'))}
          rows={4}
          required
        />
        {error ? <p className="text-sm text-chartrons-brick">{error}</p> : null}
        <Button type="submit" variant="primary" className="w-full">
          {t(copyKey(intent, 'submit'))}
        </Button>
      </form>
    </Modal>
  );
}
