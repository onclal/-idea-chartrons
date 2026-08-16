import { useTranslation } from 'react-i18next';
import { acteurHasAppointment, sanitizeExternalUrl, type ActeurLocal } from '@idea-chartrons/shared';
import { Button } from './ui';

interface AppointmentButtonProps {
  acteur: ActeurLocal;
  className?: string;
}

export function AppointmentButton({ acteur, className = '' }: AppointmentButtonProps) {
  const { t } = useTranslation();
  const href = sanitizeExternalUrl(acteur.appointmentUrl);
  if (!acteurHasAppointment(acteur) || !href) return null;

  return (
    <Button
      variant="bordeaux"
      size="md"
      className={`w-full ${className}`}
      onClick={(event) => {
        event.stopPropagation();
        window.open(href, '_blank', 'noopener,noreferrer');
      }}
    >
      {t('acteurs.appointment.cta')}
    </Button>
  );
}
