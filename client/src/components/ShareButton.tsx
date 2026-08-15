import type { MouseEvent } from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from './ui';
import { useToast } from '../context/ToastContext';
import { shareOrCopy } from '../lib/share';

interface ShareButtonProps {
  title: string;
  text: string;
  url: string;
  label?: string;
  variant?: 'primary' | 'secondary' | 'gold' | 'ghost' | 'bordeaux';
  className?: string;
}

export function ShareButton({
  title,
  text,
  url,
  label,
  variant = 'secondary',
  className = '',
}: ShareButtonProps) {
  const { t } = useTranslation();
  const { showToast } = useToast();

  const handleClick = async (event: MouseEvent) => {
    event.preventDefault();
    event.stopPropagation();
    const result = await shareOrCopy({ title, text, url });
    if (result === 'copied') showToast(t('share.copied'));
    if (result === 'failed') showToast(t('share.failed'), 'error');
  };

  return (
    <Button type="button" size="sm" variant={variant} className={`flex-1 ${className}`} onClick={handleClick}>
      {label ?? t('share.button')}
    </Button>
  );
}
