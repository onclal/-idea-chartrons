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

export function toWhatsAppDigits(phone: string): string | null {
  const digits = phone.replace(/\D/g, '');
  if (!digits) return null;
  if (digits.startsWith('33') && digits.length >= 11) return digits;
  if (digits.length === 10 && digits.startsWith('0')) return `33${digits.slice(1)}`;
  if (digits.length >= 8 && digits.length <= 15) return digits;
  return null;
}

export function buildWhatsAppHref(phone: string, text: string): string | null {
  const digits = toWhatsAppDigits(phone);
  if (!digits) return null;
  return `https://wa.me/${digits}?text=${encodeURIComponent(text)}`;
}

export function buildSmsHref(phone: string, text: string): string | null {
  const tel = toTelHref(phone);
  const number = tel.replace(/^tel:/, '');
  if (!number) return null;
  return `sms:${number}?body=${encodeURIComponent(text)}`;
}
