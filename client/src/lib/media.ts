import { isRetiredStockImage, QUAIS_CHARTRONS_IMAGE } from '@idea-chartrons/shared';

export function publicAsset(path: string): string {
  const base = import.meta.env.BASE_URL.endsWith('/')
    ? import.meta.env.BASE_URL
    : `${import.meta.env.BASE_URL}/`;
  return `${base}${path.replace(/^\//, '')}`;
}

export function quaisChartronsPhotoSrc(): string {
  return publicAsset(QUAIS_CHARTRONS_IMAGE);
}

/** Drops the retired church stock photo and prefixes local public assets with the Vite base. */
export function resolveMediaUrl(url: string | null | undefined): string | null {
  if (!url || isRetiredStockImage(url)) return null;
  if (/^(https?:|data:|blob:)/i.test(url) || url.startsWith('/')) return url;
  return publicAsset(url);
}
