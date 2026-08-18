import { allChartronsPois, normalizeSearchText, type ChartronsPoi } from '@idea-chartrons/shared';

const COOL_HINTS = [
  'parc',
  'jardin',
  'square',
  'fontaine',
  'ombre',
  'banc',
  'eglise',
  'musee',
  'halle',
  'bibliotheque',
  'jardin public',
  'quai',
  'berge',
  'place du marche',
];

function poiHaystack(poi: ChartronsPoi): string {
  return normalizeSearchText(`${poi.name} ${poi.specialty} ${poi.description} ${poi.subcategory} ${poi.address}`);
}

export function confortDeliveryPois(limit = 8): ChartronsPoi[] {
  const scored = allChartronsPois()
    .map((poi) => {
      const hay = poiHaystack(poi);
      let score = 0;
      if (poi.hasDelivery) score += 40;
      if (/pharmacie|pharmacy/.test(hay)) score += 28;
      if (poi.accessible) score += 6;
      if (poi.tier === 'premium_pro') score += 8;
      if (/livraison|delivery|emporter|a domicile/.test(hay)) score += 12;
      return { poi, score };
    })
    .filter((entry) => entry.score >= 28)
    .sort((a, b) => b.score - a.score || a.poi.name.localeCompare(b.poi.name, 'fr'));

  return scored.slice(0, limit).map((entry) => entry.poi);
}

export function confortCoolPois(limit = 8): ChartronsPoi[] {
  const scored = allChartronsPois()
    .map((poi) => {
      const hay = poiHaystack(poi);
      let score = 0;
      if (poi.subcategory === 'patrimoine_tourisme') score += 12;
      if (COOL_HINTS.some((hint) => hay.includes(normalizeSearchText(hint)))) score += 24;
      if (poi.accessible) score += 8;
      if (/banc|ombre|fontaine|parc|jardin/.test(hay)) score += 10;
      return { poi, score };
    })
    .filter((entry) => entry.score >= 24)
    .sort((a, b) => b.score - a.score || a.poi.name.localeCompare(b.poi.name, 'fr'));

  return scored.slice(0, limit).map((entry) => entry.poi);
}

export function poiListenText(poi: Pick<ChartronsPoi, 'name' | 'specialty' | 'address' | 'description' | 'phone'>): string {
  return [poi.name, poi.specialty, poi.address, poi.description, poi.phone ? `Téléphone ${poi.phone}` : '']
    .filter(Boolean)
    .join('. ');
}
