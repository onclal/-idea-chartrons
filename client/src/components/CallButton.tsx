import { useTranslation } from 'react-i18next';
import { toTelHref } from '../lib/phone';

interface CallButtonProps {
  phone: string;
  className?: string;
}

export function CallButton({ phone, className = '' }: CallButtonProps) {
  const { t } = useTranslation();
  const href = toTelHref(phone);
  if (!href.startsWith('tel:')) return null;

  return (
    <a
      href={href}
      className={`inline-flex items-center justify-center gap-2 min-h-[44px] px-4 py-2 rounded-xl bg-chartrons-bordeaux text-white text-sm font-semibold shadow-sm hover:bg-chartrons-bordeaux-light active:scale-[0.97] transition-all touch-target ${className}`}
    >
      📞 {t('common.call')}
    </a>
  );
}
