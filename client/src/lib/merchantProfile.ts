export function merchantProfilePath(id: string): string {
  return `/acteurs?fiche=${encodeURIComponent(id)}&confort=1`;
}

export function whatsappShareHref(text: string): string {
  return `https://wa.me/?text=${encodeURIComponent(text)}`;
}

export function smsShareHref(text: string): string {
  return `sms:?&body=${encodeURIComponent(text)}`;
}
