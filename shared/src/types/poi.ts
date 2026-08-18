import type { ChartronsSubcategory } from '../data/taxonomy.js';

export type ChartronsPoiCategory =
  | 'bouche_restauration'
  | 'mode_deco_antiquites'
  | 'sante_bien_etre'
  | 'patrimoine_culture'
  | 'services_artisanat';

/** Parcours métier : table, rendez-vous, retrait/collecte, ou institution publique. */
export const BUSINESS_TYPES = ['restaurant', 'service_rdv', 'commerce_collect', 'institution'] as const;
export type BusinessType = (typeof BUSINESS_TYPES)[number];

export const BUSINESS_TYPE_LABELS: Record<BusinessType, { fr: string; en: string }> = {
  restaurant: { fr: 'Restaurant / café', en: 'Restaurant / café' },
  service_rdv: { fr: 'Service sur rendez-vous', en: 'Appointment-based service' },
  commerce_collect: { fr: 'Commerce & collecte', en: 'Retail & collect' },
  institution: { fr: 'Institution', en: 'Institution' },
};

/** Gratuit pour tout commerce local ; Premium Pro = adhésion association. */
export const MERCHANT_TIERS = ['free', 'premium_pro'] as const;
export type MerchantTier = (typeof MERCHANT_TIERS)[number];

export const MERCHANT_TIER_LABELS: Record<MerchantTier, { fr: string; en: string }> = {
  free: { fr: 'Fiche gratuite', en: 'Free listing' },
  premium_pro: { fr: 'Premium Pro', en: 'Premium Pro' },
};

/** Réseaux publics : toujours cliquables, même en fiche gratuite. */
export interface PoiSocialLinks {
  instagram?: string;
  facebook?: string;
  whatsapp?: string;
}

export interface PoiReputation {
  score: number | null;
  reviews: number | null;
}

export interface PoiCatalogItem {
  name: string;
  description?: string;
  /** Prix TTC en euros. */
  price?: number;
  ingredients?: string[];
}

export interface PoiCatalog {
  items: PoiCatalogItem[];
  menus?: string[];
}

/**
 * Fiche annuaire hydratée. `businessType` et `tier` sont toujours présents
 * après `hydrateChartronsPoi` ; le lien site web n’est exposé qu’en Premium Pro.
 */
export interface ChartronsPoi {
  id: string;
  name: string;
  category: ChartronsPoiCategory;
  subcategory: ChartronsSubcategory;
  specialty: string;
  address: string;
  coordinates: { lat: number; lng: number };
  description: string;
  isMerchant: boolean;
  businessType: BusinessType;
  tier: MerchantTier;
  hasMenu?: boolean;
  hasBooking?: boolean;
  bookingUrl?: string;
  /** Téléphone affichable, prêt pour un lien `tel:`. */
  phone?: string;
  /** Adresse e-mail, prête pour un lien `mailto:`. */
  email?: string;
  socialLinks?: PoiSocialLinks;
  /** URL du site : réservée à l’affichage Premium Pro. */
  websiteUrl?: string;
  /** @deprecated Prefer `websiteUrl`. Conservé pour l’import OSM existant. */
  website?: string;
  imageUrl?: string;
  rating?: number;
  reviewsCount?: number;
  openingHours?: string;
  qualifications: string[];
  reputation: PoiReputation;
  catalog: PoiCatalog;
}

/** Forme stockée (OSM / fiches curées) : les champs d’annuaire peuvent être inférés. */
export type ChartronsPoiInput = Omit<
  ChartronsPoi,
  'businessType' | 'tier' | 'qualifications' | 'reputation' | 'catalog' | 'socialLinks' | 'websiteUrl' | 'email'
> &
  Partial<
    Pick<
      ChartronsPoi,
      'businessType' | 'tier' | 'qualifications' | 'reputation' | 'catalog' | 'socialLinks' | 'websiteUrl' | 'email'
    >
  >;

export function isBusinessType(value: string): value is BusinessType {
  return (BUSINESS_TYPES as readonly string[]).includes(value);
}

export function isMerchantTier(value: string): value is MerchantTier {
  return (MERCHANT_TIERS as readonly string[]).includes(value);
}

export function isPremiumProPoi(poi: Pick<ChartronsPoi, 'tier'> | null | undefined): boolean {
  return poi?.tier === 'premium_pro';
}
