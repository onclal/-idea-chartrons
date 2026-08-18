import { Badge } from './ui';
import { useTranslation } from 'react-i18next';

export interface AccessibilityBadgeSource {
  hasDelivery?: boolean | null;
  wheelchairAccessible?: boolean | null;
  seniorFriendly?: boolean | null;
  accessible?: boolean | null;
}

interface AccessibilityBadgesProps {
  source: AccessibilityBadgeSource;
  className?: string;
}

export function AccessibilityBadges({ source, className = '' }: AccessibilityBadgesProps) {
  const { t } = useTranslation();
  const wheelchair = Boolean(source.wheelchairAccessible);
  const senior = Boolean(source.seniorFriendly) || (Boolean(source.accessible) && !wheelchair);
  const delivery = Boolean(source.hasDelivery);

  if (!wheelchair && !senior && !delivery) return null;

  return (
    <div className={`flex flex-wrap gap-1.5 ${className}`}>
      {delivery && (
        <Badge variant="green" icon="📦">
          {t('access.delivery')}
        </Badge>
      )}
      {wheelchair && (
        <Badge variant="olive" icon="♿">
          {t('access.wheelchair')}
        </Badge>
      )}
      {senior && (
        <Badge variant="brass" icon="☀️">
          {t('access.senior')}
        </Badge>
      )}
    </div>
  );
}
