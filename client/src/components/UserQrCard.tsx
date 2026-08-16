import { useTranslation } from 'react-i18next';
import { generateQrClientCode, type User } from '@idea-chartrons/shared';
import { Card } from './ui';
import { QrCodeDisplay } from './QrCodeDisplay';

interface UserQrCardProps {
  user: User;
}

export function UserQrCard({ user }: UserQrCardProps) {
  const { t } = useTranslation();
  const value = user.qrCodeClient || generateQrClientCode(user.id);

  return (
    <Card className="text-center !p-5 bg-chartrons-beige/40 border border-chartrons-beige">
      <h4 className="text-sm font-semibold text-chartrons-olive-dark mb-1">
        {t('profile.qrTitle')}
      </h4>
      <p className="text-xs text-chartrons-warm-gray leading-relaxed mb-4">
        {t('profile.qrHint')}
      </p>
      <QrCodeDisplay value={value} size={176} label={value} />
      <p className="text-[11px] text-chartrons-olive-dark mt-3 font-medium">
        {user.nom}
      </p>
    </Card>
  );
}
