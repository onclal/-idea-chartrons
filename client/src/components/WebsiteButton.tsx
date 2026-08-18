import { useTranslation } from 'react-i18next';
import { sanitizeExternalUrl } from '@idea-chartrons/shared';
import { Button } from './ui';

interface WebsiteButtonProps {
  href: string;
  className?: string;
}

export function WebsiteButton({ href, className = '' }: WebsiteButtonProps) {
  const { t } = useTranslation();
  const url = sanitizeExternalUrl(href);
  if (!url) return null;
  return (
    <Button
      type="button"
      variant="gold"
      className={`w-full ${className}`}
      onClick={(event) => {
        event.stopPropagation();
        window.open(url, '_blank', 'noopener,noreferrer');
      }}
    >
      🌐 {t('acteurs.social.website')}
    </Button>
  );
}
