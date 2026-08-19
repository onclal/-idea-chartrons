import { CHARTRONS_MAP_CENTER } from '../data/mapPois.js';
import { hydrateChartronsPoi } from './poi.js';
import { normalizeSearchText } from './search.js';
import { isPremiumProMerchant, merchantTierOf } from '../types/merchant.js';
import type { ActeurLocal, AntiqueItem } from '../types/models.js';
import type { ChartronsPoi } from '../types/poi.js';

/** Quota de pépites actives pour un brocanteur Premium. */
export const PREMIUM_PEPITE_ACTIVE_LIMIT = 10;

const ANTIQUE_HINTS = [
  'antiquaire',
  'antiquites',
  'antiquite',
  'brocante',
  'brocanteur',
  'vintage',
  'chineur',
  'puces',
  'flea',
  'antique',
];

export type PepitePublishDenial = 'not_dealer' | 'free_tier' | 'quota';

export function isAntiqueDealerText(value: string): boolean {
  const hay = normalizeSearchText(value);
  return ANTIQUE_HINTS.some((hint) => hay.includes(hint));
}

export function isAntiqueDealer(acteur: Pick<ActeurLocal, 'nomCommerce' | 'description' | 'specialite'>): boolean {
  return isAntiqueDealerText(`${acteur.specialite ?? ''} ${acteur.nomCommerce} ${acteur.description}`);
}

export function isAntiquePoi(poi: Pick<ChartronsPoi, 'name' | 'specialty' | 'description'>): boolean {
  return isAntiqueDealerText(`${poi.specialty} ${poi.name} ${poi.description}`);
}

export function isNotreDameCertifiedDealer(
  merchant: Pick<ActeurLocal, 'isVip' | 'tier' | 'nomCommerce' | 'description' | 'specialite'>,
): boolean {
  return isAntiqueDealer(merchant) && isPremiumProMerchant(merchant);
}

export function activePepitesForMerchant(items: AntiqueItem[], merchantId: string): AntiqueItem[] {
  return items.filter((item) => item.merchantId === merchantId && item.status === 'active');
}

export function canPublishPepite(
  merchant: Pick<ActeurLocal, 'id' | 'isVip' | 'tier' | 'nomCommerce' | 'description' | 'specialite'>,
  items: AntiqueItem[],
): { ok: true; reason: null } | { ok: false; reason: PepitePublishDenial } {
  if (!isAntiqueDealer(merchant)) return { ok: false, reason: 'not_dealer' };
  if (!isPremiumProMerchant(merchant)) return { ok: false, reason: 'free_tier' };
  if (activePepitesForMerchant(items, merchant.id).length >= PREMIUM_PEPITE_ACTIVE_LIMIT) {
    return { ok: false, reason: 'quota' };
  }
  return { ok: true, reason: null };
}

export function publicPepites(items: AntiqueItem[], acteurs: ActeurLocal[]): AntiqueItem[] {
  const premiumIds = new Set(
    acteurs.filter((acteur) => isNotreDameCertifiedDealer(acteur)).map((acteur) => acteur.id),
  );
  return items.filter((item) => premiumIds.has(item.merchantId));
}

export function searchAntiqueItems(query: string, items: AntiqueItem[]): AntiqueItem[] {
  const active = items.filter((item) => item.status === 'active');
  const tokens = normalizeSearchText(query)
    .split(/\s+/)
    .filter((token) => token.length >= 3);
  if (tokens.length === 0) return active;

  return active
    .map((item) => {
      const blob = normalizeSearchText(`${item.title} ${item.description} ${item.style} ${item.era}`);
      let score = 0;
      for (const token of tokens) {
        if (blob.includes(token)) score += 20;
      }
      return { item, score };
    })
    .filter((entry) => entry.score > 0)
    .sort((a, b) => b.score - a.score)
    .map((entry) => entry.item);
}

export function merchantIdsForPoi(poi: Pick<ChartronsPoi, 'id'>): string[] {
  return [poi.id, `acteur-${poi.id}`];
}

export function pepiteScoreForPoi(poi: ChartronsPoi, items: AntiqueItem[], query: string): number {
  const merchantIds = new Set(merchantIdsForPoi(poi));
  const owned = items.filter((item) => merchantIds.has(item.merchantId) && item.status === 'active');
  if (owned.length === 0) return 0;
  const matched = searchAntiqueItems(query, owned);
  if (matched.length === 0) return Math.min(12, owned.length * 4);
  return Math.min(56, 18 + matched.length * 14);
}

export function matchingPepitesForPoi(poi: ChartronsPoi, items: AntiqueItem[], query: string): AntiqueItem[] {
  const merchantIds = new Set(merchantIdsForPoi(poi));
  const owned = items.filter((item) => merchantIds.has(item.merchantId));
  const hits = searchAntiqueItems(query, owned);
  return hits.length > 0 ? hits : owned.filter((item) => item.status === 'active').slice(0, 2);
}

export function antiqueDealersFromDirectory(acteurs: ActeurLocal[]): ActeurLocal[] {
  return acteurs.filter(isAntiqueDealer);
}

export function acteurAsAntiquePoi(acteur: ActeurLocal): ChartronsPoi {
  const lat = acteur.latitude ?? CHARTRONS_MAP_CENTER.latitude;
  const lng = acteur.longitude ?? CHARTRONS_MAP_CENTER.longitude;
  return hydrateChartronsPoi({
    id: acteur.id,
    name: acteur.nomCommerce,
    category: 'mode_deco_antiquites',
    subcategory: acteur.subcategory === 'boutiques' || acteur.subcategory === 'artisans' ? acteur.subcategory : 'boutiques',
    specialty: acteur.specialite?.trim() || 'Antiquaire',
    address: acteur.adresse,
    coordinates: { lat, lng },
    description: acteur.description,
    isMerchant: acteur.isMerchant,
    businessType: 'commerce_collect',
    tier: merchantTierOf(acteur),
    phone: acteur.telephone ?? undefined,
    email: acteur.merchantEmail ?? undefined,
    imageUrl: acteur.photos[0],
    rating: acteur.rating ?? undefined,
    reviewsCount: acteur.reviewsCount ?? undefined,
    openingHours: acteur.openingHours ?? undefined,
    hasDelivery: Boolean(acteur.hasDelivery),
    wheelchairAccessible: Boolean(acteur.wheelchairAccessible),
    seniorFriendly: Boolean(acteur.seniorFriendly),
    isDemo: acteur.isDemo,
  });
}

export function mergeAntiquePoiPool(pois: ChartronsPoi[], acteurs: ActeurLocal[] = []): ChartronsPoi[] {
  const antiquePois = pois.filter(isAntiquePoi);
  const known = new Set(antiquePois.flatMap((poi) => merchantIdsForPoi(poi)));
  const extras = antiqueDealersFromDirectory(acteurs)
    .filter((acteur) => !known.has(acteur.id))
    .map(acteurAsAntiquePoi);
  return [...antiquePois, ...extras];
}
