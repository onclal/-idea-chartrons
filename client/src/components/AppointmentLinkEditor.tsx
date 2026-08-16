import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { type ActeurLocal } from '@idea-chartrons/shared';
import { Button, Input } from './ui';

interface AppointmentLinkEditorProps {
  acteur: ActeurLocal;
  saving?: boolean;
  onSave: (url: string) => void;
}

export function AppointmentLinkEditor({ acteur, saving, onSave }: AppointmentLinkEditorProps) {
  const { t } = useTranslation();
  const [url, setUrl] = useState(acteur.appointmentUrl ?? '');

  useEffect(() => {
    setUrl(acteur.appointmentUrl ?? '');
  }, [acteur.id, acteur.appointmentUrl]);

  return (
    <div className="space-y-4">
      <div>
        <h3 className="font-bold text-chartrons-green-dark">{t('proSpace.appointment.title')}</h3>
        <p className="text-xs text-chartrons-warm-gray mt-1 leading-relaxed">{t('proSpace.appointment.subtitle')}</p>
      </div>
      <Input
        type="url"
        label={t('proSpace.appointment.url')}
        value={url}
        onChange={(event) => setUrl(event.target.value)}
        placeholder={t('proSpace.appointment.placeholder')}
        autoComplete="off"
      />
      <p className="text-xs text-chartrons-warm-gray">{t('proSpace.appointment.hint')}</p>
      <Button type="button" variant="bordeaux" className="w-full" disabled={saving} onClick={() => onSave(url)}>
        {saving ? t('common.loading') : t('proSpace.appointment.save')}
      </Button>
    </div>
  );
}
