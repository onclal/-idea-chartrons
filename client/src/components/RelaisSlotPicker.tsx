import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { RelaisCreneauType, type RelaisCreneau } from '@idea-chartrons/shared';
import { Button } from './ui';
import { api } from '../lib/api';

interface RelaisSlotPickerProps {
  type: RelaisCreneauType;
  selectedId: string | null;
  onSelect: (id: string) => void;
}

export function RelaisSlotPicker({ type, selectedId, onSelect }: RelaisSlotPickerProps) {
  const { t, i18n } = useTranslation();
  const [creneaux, setCreneaux] = useState<RelaisCreneau[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.getCreneaux(type)
      .then(setCreneaux)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [type]);

  if (loading) {
    return <p className="text-sm text-chartrons-warm-gray">{t('common.loading')}</p>;
  }

  if (creneaux.length === 0) {
    return <p className="text-sm text-chartrons-warm-gray">{t('relais.noSlots')}</p>;
  }

  const grouped = creneaux.reduce<Record<string, RelaisCreneau[]>>((acc, c) => {
    (acc[c.date] ??= []).push(c);
    return acc;
  }, {});

  const locale = i18n.language === 'fr' ? 'fr-FR' : 'en-GB';

  return (
    <div className="space-y-3 max-h-60 overflow-y-auto">
      {Object.entries(grouped).map(([date, slots]) => (
        <div key={date}>
          <p className="text-xs font-medium text-chartrons-warm-gray mb-1.5">
            {new Date(date + 'T12:00:00').toLocaleDateString(locale, {
              weekday: 'long',
              day: 'numeric',
              month: 'short',
            })}
          </p>
          <div className="grid grid-cols-2 gap-2">
            {slots.map((slot) => {
              const places = slot.capacite - slot.reserves;
              const isSelected = selectedId === slot.id;
              return (
                <button
                  key={slot.id}
                  onClick={() => onSelect(slot.id)}
                  className={`p-2.5 rounded-xl border text-left transition-colors ${
                    isSelected
                      ? 'border-chartrons-green bg-chartrons-green/5'
                      : 'border-chartrons-gold/20 hover:border-chartrons-green/30'
                  }`}
                >
                  <p className="text-sm font-medium text-chartrons-green-dark">
                    {slot.heureDebut} – {slot.heureFin}
                  </p>
                  <p className="text-[10px] text-chartrons-warm-gray">
                    {t('relais.slotsRemaining', { count: places })}
                  </p>
                </button>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}

interface DepotSlotModalProps {
  open: boolean;
  onClose: () => void;
  onConfirm: (creneauId: string) => void;
  loading?: boolean;
}

export function DepotSlotModal({ open, onClose, onConfirm, loading }: DepotSlotModalProps) {
  const { t } = useTranslation();
  const [selected, setSelected] = useState<string | null>(null);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
      <div className="absolute inset-0 bg-chartrons-green-dark/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-lg bg-chartrons-cream rounded-t-3xl sm:rounded-3xl shadow-xl p-5 space-y-4">
        <h3 className="text-lg font-bold text-chartrons-green">{t('relais.bookDepot')}</h3>
        <p className="text-sm text-chartrons-warm-gray">{t('relais.bookDepotHint')}</p>
        <RelaisSlotPicker
          type={RelaisCreneauType.Depot}
          selectedId={selected}
          onSelect={setSelected}
        />
        <div className="flex gap-2">
          <Button variant="secondary" className="flex-1" onClick={onClose}>
            {t('common.cancel')}
          </Button>
          <Button
            className="flex-1"
            disabled={!selected || loading}
            onClick={() => selected && onConfirm(selected)}
          >
            {loading ? t('common.loading') : t('relais.confirmBooking')}
          </Button>
        </div>
      </div>
    </div>
  );
}
