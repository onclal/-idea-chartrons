/**
 * Taxonomie unifiée IDÉA CHARTRONS.
 *
 * Trois vocabulaires stricts et typés :
 *  - `ChartronsSubcategory` : sous-catégorie commerciale d'un POI (annuaire + concierge IA).
 *  - `CivicSubcategoryId`   : signalements adressés à la Mairie.
 *  - `SafetySubcategoryId`  : signalements adressés à la Police Municipale.
 *
 * Le champ libre `ChartronsPoi.specialty` (ex-`subcategory`) reste la spécialité fine
 * affichée à l'utilisateur ; `subcategory` est la classification unifiée obligatoire.
 */

export interface TaxonomyLabel {
  fr: string;
  en: string;
}

/* ------------------------------------------------------------------ *
 * Sous-catégories commerciales
 * ------------------------------------------------------------------ */

export const CHARTRONS_SUBCATEGORIES = [
  'artisans',
  'metiers_de_bouche',
  'boutiques',
  'services_proximite',
  'restauration_cafes',
  'patrimoine_tourisme',
] as const;

export type ChartronsSubcategory = (typeof CHARTRONS_SUBCATEGORIES)[number];

export const CHARTRONS_SUBCATEGORY_LABELS: Record<ChartronsSubcategory, TaxonomyLabel> = {
  artisans: { fr: 'Artisans', en: 'Artisans & workshops' },
  metiers_de_bouche: { fr: 'Métiers de bouche', en: 'Food artisans' },
  boutiques: { fr: 'Boutiques', en: 'Shops' },
  services_proximite: { fr: 'Services de proximité', en: 'Local services' },
  restauration_cafes: { fr: 'Restauration & Cafés', en: 'Restaurants & cafés' },
  patrimoine_tourisme: { fr: 'Patrimoine & Tourisme', en: 'Heritage & tourism' },
};

export const CHARTRONS_SUBCATEGORY_ICONS: Record<ChartronsSubcategory, string> = {
  artisans: '🛠️',
  metiers_de_bouche: '🥖',
  boutiques: '🛍️',
  services_proximite: '🏦',
  restauration_cafes: '🍽️',
  patrimoine_tourisme: '🏛️',
};

export function isChartronsSubcategory(value: string): value is ChartronsSubcategory {
  return (CHARTRONS_SUBCATEGORIES as readonly string[]).includes(value);
}

/* ------------------------------------------------------------------ *
 * Classification spécialité fine -> sous-catégorie unifiée
 * ------------------------------------------------------------------ */

function normalize(value: string): string {
  return value
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/['’]/g, ' ')
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();
}

/**
 * Table exhaustive des spécialités présentes dans les jeux de données
 * (POI curés + import OpenStreetMap). Clés normalisées.
 */
const SPECIALTY_MAP: Record<string, ChartronsSubcategory> = {
  // Restauration & Cafés
  restaurant: 'restauration_cafes',
  'restaurant bistro': 'restauration_cafes',
  'restauration rapide': 'restauration_cafes',
  bar: 'restauration_cafes',
  pub: 'restauration_cafes',
  cafe: 'restauration_cafes',
  'cafe salon de the': 'restauration_cafes',
  'cafe torrefaction': 'restauration_cafes',

  // Métiers de bouche
  boulangerie: 'metiers_de_bouche',
  patisserie: 'metiers_de_bouche',
  boucherie: 'metiers_de_bouche',
  fromagerie: 'metiers_de_bouche',
  epicerie: 'metiers_de_bouche',
  primeur: 'metiers_de_bouche',
  supermarche: 'metiers_de_bouche',
  caviste: 'metiers_de_bouche',
  vigneron: 'metiers_de_bouche',
  traiteur: 'metiers_de_bouche',
  caterer: 'metiers_de_bouche',
  confiserie: 'metiers_de_bouche',
  dairy: 'metiers_de_bouche',
  honey: 'metiers_de_bouche',
  'frozen food': 'metiers_de_bouche',
  'convenience gas': 'metiers_de_bouche',

  // Boutiques
  'pret a porter': 'boutiques',
  chaussures: 'boutiques',
  bijouterie: 'boutiques',
  librairie: 'boutiques',
  'maison de la presse': 'boutiques',
  tabac: 'boutiques',
  decoration: 'boutiques',
  'maison decoration': 'boutiques',
  mobilier: 'boutiques',
  antiquaire: 'boutiques',
  bazar: 'boutiques',
  'arts de la table': 'boutiques',
  fleuriste: 'boutiques',
  sport: 'boutiques',
  games: 'boutiques',
  photo: 'boutiques',
  video: 'boutiques',
  appliance: 'boutiques',
  kitchen: 'boutiques',
  'household linen': 'boutiques',
  paint: 'boutiques',
  'car parts': 'boutiques',

  // Artisans
  tapissier: 'artisans',
  atelier: 'artisans',
  handicraft: 'artisans',
  plombier: 'artisans',
  dressmaker: 'artisans',
  tailleur: 'artisans',
  pottery: 'artisans',
  velo: 'artisans',
  'reparateur de velos': 'artisans',
  'car repair': 'artisans',

  // Services de proximité
  banque: 'services_proximite',
  assurance: 'services_proximite',
  avocat: 'services_proximite',
  notaire: 'services_proximite',
  architecte: 'services_proximite',
  'agence immobiliere': 'services_proximite',
  'agence d emploi': 'services_proximite',
  'agence de voyages': 'services_proximite',
  'bureau entreprise': 'services_proximite',
  'bureau service': 'services_proximite',
  coworking: 'services_proximite',
  reprographie: 'services_proximite',
  'la poste': 'services_proximite',
  formation: 'services_proximite',
  'informatique digital': 'services_proximite',
  'services financiers': 'services_proximite',
  'property developer': 'services_proximite',
  'advertising agency': 'services_proximite',
  publisher: 'services_proximite',
  union: 'services_proximite',
  pharmacie: 'services_proximite',
  medecin: 'services_proximite',
  laboratoire: 'services_proximite',
  opticien: 'services_proximite',
  'medecine douce': 'services_proximite',
  rehabilitation: 'services_proximite',
  'sante bien etre': 'services_proximite',
  'institut de beaute': 'services_proximite',
  'personal service': 'services_proximite',
  coiffeur: 'services_proximite',
  'coiffeur barbier': 'services_proximite',
  veterinaire: 'services_proximite',
  'pet grooming': 'services_proximite',
  laverie: 'services_proximite',
  pressing: 'services_proximite',
  'pressing laverie': 'services_proximite',
  cleaning: 'services_proximite',

  // Patrimoine & Tourisme
  musee: 'patrimoine_tourisme',
  'patrimoine culture': 'patrimoine_tourisme',
  'lieu de culte': 'patrimoine_tourisme',
  galerie: 'patrimoine_tourisme',
  'galerie art': 'patrimoine_tourisme',
  hotel: 'patrimoine_tourisme',
  'maison d hotes': 'patrimoine_tourisme',
};

/** Repli par mot-clé pour toute spécialité future non listée. */
const KEYWORD_FALLBACK: Array<[string[], ChartronsSubcategory]> = [
  [['restaurant', 'bistro', 'brasserie', 'bar', 'pub', 'cafe', 'creperie', 'pizzeria'], 'restauration_cafes'],
  [
    ['boulangerie', 'patisserie', 'boucherie', 'charcuterie', 'fromage', 'epicerie', 'primeur',
      'supermarche', 'caviste', 'vin', 'traiteur', 'chocolat', 'alimentation', 'food'],
    'metiers_de_bouche',
  ],
  [['artisan', 'atelier', 'reparat', 'plombier', 'menuisier', 'craft', 'couturier', 'cordonnier'], 'artisans'],
  [
    ['banque', 'assurance', 'avocat', 'notaire', 'agence', 'bureau', 'sante', 'medic', 'medecin',
      'pharmacie', 'coiffeur', 'beaute', 'pressing', 'laverie', 'service', 'office', 'clinic'],
    'services_proximite',
  ],
  [['musee', 'patrimoine', 'culte', 'galerie', 'hotel', 'monument', 'tourisme'], 'patrimoine_tourisme'],
  [['boutique', 'magasin', 'shop', 'store', 'mode', 'vetement'], 'boutiques'],
];

/** Repli final par catégorie large de POI. */
const CATEGORY_FALLBACK: Record<string, ChartronsSubcategory> = {
  bouche_restauration: 'restauration_cafes',
  mode_deco_antiquites: 'boutiques',
  sante_bien_etre: 'services_proximite',
  patrimoine_culture: 'patrimoine_tourisme',
  services_artisanat: 'services_proximite',
};

/**
 * Classe une spécialité fine dans la taxonomie unifiée.
 * Déterministe : table exacte, puis mots-clés, puis catégorie large.
 */
export function classifySubcategory(specialty: string, category: string): ChartronsSubcategory {
  const key = normalize(specialty);
  const exact = SPECIALTY_MAP[key];
  if (exact) return exact;

  for (const [keywords, subcategory] of KEYWORD_FALLBACK) {
    if (keywords.some((word) => key.includes(word))) return subcategory;
  }

  return CATEGORY_FALLBACK[category] ?? 'services_proximite';
}

/* ------------------------------------------------------------------ *
 * Signalements Mairie (civic) et Police Municipale (safety)
 * ------------------------------------------------------------------ */

export const CIVIC_SUBCATEGORIES = [
  'voirie_proprete',
  'eclairage_public',
  'espaces_verts_animaux',
  'accessibilite_pmr',
] as const;

export type CivicSubcategoryId = (typeof CIVIC_SUBCATEGORIES)[number];

export const SAFETY_SUBCATEGORIES = [
  'nuisances_sonores',
  'tranquillite_publique',
  'stationnement_genant',
] as const;

export type SafetySubcategoryId = (typeof SAFETY_SUBCATEGORIES)[number];

export type ReportSubcategoryId = CivicSubcategoryId | SafetySubcategoryId;

export const REPORT_SUBCATEGORY_LABELS: Record<ReportSubcategoryId, TaxonomyLabel> = {
  voirie_proprete: { fr: 'Voirie & Propreté', en: 'Roads & cleanliness' },
  eclairage_public: { fr: 'Éclairage public', en: 'Street lighting' },
  espaces_verts_animaux: { fr: 'Espaces verts & Animaux', en: 'Parks & animals' },
  accessibilite_pmr: { fr: 'Accessibilité PMR / Poussettes', en: 'Accessibility (wheelchair/stroller)' },
  nuisances_sonores: { fr: 'Nuisances sonores', en: 'Noise nuisance' },
  tranquillite_publique: { fr: 'Tranquillité publique', en: 'Public order' },
  stationnement_genant: { fr: 'Stationnement gênant', en: 'Obstructive parking' },
};

export function isCivicSubcategory(value: string): value is CivicSubcategoryId {
  return (CIVIC_SUBCATEGORIES as readonly string[]).includes(value);
}

export function isSafetySubcategory(value: string): value is SafetySubcategoryId {
  return (SAFETY_SUBCATEGORIES as readonly string[]).includes(value);
}
