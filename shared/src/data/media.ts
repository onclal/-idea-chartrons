/** Generic Unsplash church used as a neighborhood placeholder — never restore. */
export const RETIRED_STOCK_IMAGE_MARKERS = ['photo-1548625361-1811e59543e3'] as const;

/** Local hero of the Quais des Chartrons (Marc Ryckaert, CC BY 3.0). */
export const QUAIS_CHARTRONS_IMAGE = 'images/quais-chartrons.jpg';

export function isRetiredStockImage(url: string | null | undefined): boolean {
  if (!url) return false;
  return RETIRED_STOCK_IMAGE_MARKERS.some((marker) => url.includes(marker));
}

export function withoutRetiredStockPhotos(photos: string[] | undefined | null): string[] {
  return (photos ?? []).filter((photo) => !isRetiredStockImage(photo));
}
