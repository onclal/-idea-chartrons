export function toTelHref(phone: string): string {
  const trimmed = phone.trim();
  const digits = trimmed.replace(/[^\d]/g, '');
  if (!digits) return 'tel:';

  if (trimmed.startsWith('+')) {
    return `tel:+${digits}`;
  }

  if (digits.startsWith('33') && digits.length >= 11) {
    return `tel:+${digits}`;
  }

  if (digits.length === 10 && digits.startsWith('0')) {
    return `tel:+33${digits.slice(1)}`;
  }

  return `tel:${digits}`;
}
