import { toTelHref } from '../lib/phone';

interface PhoneLinkProps {
  phone: string | null | undefined;
  className?: string;
}

export function PhoneLink({ phone, className = '' }: PhoneLinkProps) {
  if (!phone?.trim()) return null;

  return (
    <a
      href={toTelHref(phone)}
      className={`inline-flex items-center gap-1.5 text-sm font-semibold text-chartrons-bordeaux hover:underline touch-target ${className}`}
      onClick={(event) => event.stopPropagation()}
    >
      📞 {phone}
    </a>
  );
}
