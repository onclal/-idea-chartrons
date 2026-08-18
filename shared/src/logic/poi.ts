import type {
  BusinessType,
  ChartronsPoi,
  ChartronsPoiInput,
  MerchantTier,
  PoiCatalog,
  PoiReputation,
  PoiSocialLinks,
} from '../types/poi.js';
import { normalizeSearchText } from './search.js';

const RESTAURANT_HINTS = [
  'restaurant',
  'bistro',
  'brasserie',
  'bar',
  'pub',
  'cafe',
  'restauration',
  'fast',
  'glacier',
  'ice cream',
  'creperie',
  'pizzeria',
];

const SERVICE_RDV_HINTS = [
  'coiffeur',
  'barbier',
  'medecin',
  'docteur',
  'dentiste',
  'kine',
  'veterinaire',
  'beaute',
  'institut',
  'opticien',
  'avocat',
  'notaire',
  'architecte',
  'immobilier',
  'plombier',
  'reparateur',
  'therapeute',
  'psychologue',
  'massage',
  'sage femme',
  'infirmier',
  'laboratoire',
];

const INSTITUTION_HINTS = [
  'musee',
  'eglise',
  'culte',
  'ecole',
  'creche',
  'halte',
  'association',
  'maison de quartier',
  'theatre',
  'cinema',
  'espace culturel',
  'halle',
  'patrimoine',
  'dab',
  'distributeur',
  'banque',
  'la poste',
  'hotel',
  'mairie',
  'galerie',
];

function haystackOf(poi: Pick<ChartronsPoiInput, 'specialty' | 'subcategory' | 'category'> & { name?: string }): string {
  return normalizeSearchText(`${poi.specialty} ${poi.subcategory} ${poi.category} ${poi.name ?? ''}`);
}

function hasHint(haystack: string, hints: string[]): boolean {
  return hints.some((hint) => haystack.includes(normalizeSearchText(hint)));
}

/** Infère le parcours métier à partir de la spécialité OSM / curée. */
export function classifyBusinessType(
  poi: Pick<ChartronsPoiInput, 'specialty' | 'subcategory' | 'category' | 'isMerchant' | 'hasBooking'>,
): BusinessType {
  const haystack = haystackOf(poi);
  const restaurant = poi.subcategory === 'restauration_cafes' || hasHint(haystack, RESTAURANT_HINTS);
  const serviceRdv = Boolean(poi.hasBooking) || hasHint(haystack, SERVICE_RDV_HINTS);
  const institution =
    !poi.isMerchant ||
    poi.subcategory === 'patrimoine_tourisme' ||
    hasHint(haystack, INSTITUTION_HINTS);

  if (restaurant) return 'restaurant';
  if (serviceRdv) return 'service_rdv';
  if (institution) return 'institution';
  return 'commerce_collect';
}

export function formatTelHref(phone: string | null | undefined): string | null {
  const trimmed = String(phone ?? '').trim();
  const digits = trimmed.replace(/[^\d]/g, '');
  if (!digits) return null;
  if (trimmed.startsWith('+')) return `tel:+${digits}`;
  if (digits.startsWith('33') && digits.length >= 11) return `tel:+${digits}`;
  if (digits.length === 10 && digits.startsWith('0')) return `tel:+33${digits.slice(1)}`;
  return `tel:${digits}`;
}

export function formatMailtoHref(email: string | null | undefined): string | null {
  const trimmed = String(email ?? '').trim();
  if (!trimmed.includes('@') || trimmed.includes(' ')) return null;
  return `mailto:${trimmed}`;
}

function emptyCatalog(hasMenu?: boolean): PoiCatalog {
  return {
    items: [],
    menus: hasMenu ? ['Carte'] : [],
  };
}

function emptyReputation(poi: ChartronsPoiInput): PoiReputation {
  return {
    score: poi.rating ?? null,
    reviews: poi.reviewsCount ?? null,
  };
}

function emptySocial(links?: PoiSocialLinks): PoiSocialLinks {
  return {
    instagram: links?.instagram,
    facebook: links?.facebook,
    whatsapp: links?.whatsapp,
  };
}

function inferHasDelivery(poi: ChartronsPoiInput): boolean {
  if (poi.hasDelivery != null) return poi.hasDelivery;
  const hay = haystackOf({ ...poi, name: poi.name });
  const blob = `${hay} ${normalizeSearchText(poi.description ?? '')}`;
  return /livraison|delivery|deliveroo|uber ?eats|a domicile|click.?collect|emporter|takeaway|take away/.test(blob);
}

function inferAccessible(poi: ChartronsPoiInput): boolean {
  if (poi.accessible != null) return poi.accessible;
  const hay = haystackOf({ ...poi, name: poi.name });
  const blob = `${hay} ${normalizeSearchText(poi.description ?? '')}`;
  if (/pmr|fauteuil|wheelchair|accessib|senior|personne agee|rampe|malvoyant/.test(blob)) return true;
  return /pharmacie|medecin|docteur|hopital|optique|laboratoire|maison de quartier/.test(hay);
}

export function defaultPoiTier(poi: ChartronsPoiInput): MerchantTier {
  if (poi.tier) return poi.tier;
  return poi.id === 'poi-rest-001' ? 'premium_pro' : 'free';
}

/** Complète une fiche OSM/curée sans supprimer les champs existants. */
export function hydrateChartronsPoi(poi: ChartronsPoiInput): ChartronsPoi {
  return {
    ...poi,
    businessType: poi.businessType ?? classifyBusinessType(poi),
    tier: defaultPoiTier(poi),
    email: poi.email,
    socialLinks: emptySocial(poi.socialLinks),
    websiteUrl: poi.websiteUrl ?? poi.website,
    qualifications: poi.qualifications ?? [],
    reputation: poi.reputation ?? emptyReputation(poi),
    catalog: poi.catalog ?? emptyCatalog(poi.hasMenu),
    hasDelivery: inferHasDelivery(poi),
    accessible: inferAccessible(poi),
  };
}

export function poiPublicWebsite(poi: Pick<ChartronsPoi, 'tier' | 'websiteUrl' | 'website'>): string | null {
  if (poi.tier !== 'premium_pro') return null;
  const url = String(poi.websiteUrl ?? poi.website ?? '').trim();
  return url || null;
}

export function poiPublicPhone(poi: Pick<ChartronsPoi, 'phone'>): string | null {
  const phone = String(poi.phone ?? '').trim();
  return phone || null;
}

export function poiPublicEmail(poi: Pick<ChartronsPoi, 'email'>): string | null {
  const email = String(poi.email ?? '').trim();
  return email || null;
}
