export async function shareOrCopy(payload: {
  title: string;
  text: string;
  url: string;
}): Promise<'shared' | 'copied' | 'aborted' | 'failed'> {
  try {
    if (typeof navigator.share === 'function') {
      await navigator.share(payload);
      return 'shared';
    }
  } catch (error) {
    if (error instanceof Error && error.name === 'AbortError') return 'aborted';
  }

  try {
    const body = [payload.title, payload.text, payload.url].filter(Boolean).join('\n');
    await navigator.clipboard.writeText(body);
    return 'copied';
  } catch {
    return 'failed';
  }
}

export function appUrl(path: string): string {
  const normalized = path.startsWith('/') ? path.slice(1) : path;
  if (typeof window === 'undefined') return `${import.meta.env.BASE_URL}${normalized}`;
  return new URL(normalized, `${window.location.origin}${import.meta.env.BASE_URL}`).toString();
}

export function placeShareText(place: { title: string; adresse: string }): string {
  return `${place.title}\n📍 ${place.adresse}`;
}

export function listShareText(
  places: { title: string; adresse: string }[],
  intro?: string,
): string {
  const lines = places.map((place, index) => `${index + 1}. ${place.title} — ${place.adresse}`);
  return [intro, ...lines].filter(Boolean).join('\n');
}
