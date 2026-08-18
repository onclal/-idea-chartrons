import { allChartronsPois } from '../data/chartronsPois.js';
import type { ChartronsPoi, ChartronsPoiCategory } from '../types/poi.js';
import {
  CHARTRONS_SUBCATEGORIES,
  type ChartronsSubcategory,
} from '../data/taxonomy.js';
import {
  CHARTRONS_DISTRICT_HERITAGE,
  CHARTRONS_STREET_HERITAGE,
  findStreetHeritage,
  normalizeHeritageText,
  streetHeritageForAddress,
  type StreetHeritage,
} from '../data/chartronsHeritage.js';
import { expandActivityQuery, normalizeSearchText, tokensMatch } from './search.js';
import { poiPublicEmail, poiPublicPhone, poiPublicWebsite } from './poi.js';
import { catalogItemsForPoi, type LocalBasket } from './conciergeRecipes.js';
import type { PostAnnonce } from '../types/models.js';

/** Langues gérées par le concierge (réponse et détection). */
export const CONCIERGE_LANGUAGES = ['fr', 'en', 'es', 'de', 'it', 'pt', 'nl'] as const;
export type ConciergeLang = (typeof CONCIERGE_LANGUAGES)[number];

/** Règle « Top 5 » : jamais plus de cinq adresses par réponse. */
export const CONCIERGE_MAX_RESULTS = 5;
/** Nombre d’adresses parlées / injectées dans le RAG, pour rester audio-ready. */
export const CONCIERGE_SPOKEN_RESULTS = 3;

export type BudgetUnit = 'person' | 'item' | 'service' | 'visit' | 'night';

export interface BudgetEstimate {
  min: number;
  max: number;
  currency: 'EUR';
  unit: BudgetUnit;
}

export type ConciergeRationaleKind =
  | 'intent'
  | 'subcategory'
  | 'keyword'
  | 'street'
  | 'rating'
  | 'menu'
  | 'booking'
  | 'clickCollect'
  | 'curated'
  | 'premium'
  | 'qualification'
  | 'social'
  | 'catalog'
  | 'delivery'
  | 'accessible';

export interface ConciergeRationale {
  kind: ConciergeRationaleKind;
  value?: string;
}

export type ConciergeAction = 'book_table' | 'book_appointment' | 'click_collect';

export interface ConciergeRecommendation {
  poiId: string;
  name: string;
  /** Sous-catégorie unifiée (taxonomie stricte). */
  subcategory: ChartronsSubcategory;
  /** Spécialité fine affichée sur la fiche. */
  specialty: string;
  category: ChartronsPoiCategory;
  address: string;
  coordinates: { lat: number; lng: number };
  phone: string | null;
  email: string | null;
  website: string | null;
  /** True if a website exists but is withheld (fiche gratuite). */
  websiteGated: boolean;
  instagram: string | null;
  facebook: string | null;
  whatsapp: string | null;
  qualifications: string[];
  justification: string;
  action: ConciergeAction | null;
  openNow: boolean | null;
  tier: 'free' | 'premium_pro';
  openingHours: string | null;
  rating: number | null;
  reviewsCount: number | null;
  score: number;
  rationale: ConciergeRationale[];
  budget: BudgetEstimate | null;
  clickAndCollect: boolean;
  bookingUrl: string | null;
  street: string | null;
  heritageId: string | null;
  hasDelivery: boolean;
  accessible: boolean;
}

interface ConciergeIntent {
  id: string;
  /** Mots-clés multilingues (fr, en, es, de, it, pt, nl) normalisés. */
  keywords: string[];
  /** Fragments de spécialité fine à rapprocher des fiches POI. */
  specialties: string[];
  /** Sous-catégorie unifiée couverte par l’intention. */
  subcategory: ChartronsSubcategory;
  budget: BudgetEstimate | null;
}

function euros(min: number, max: number, unit: BudgetUnit): BudgetEstimate {
  return { min, max, currency: 'EUR', unit };
}

const CONCIERGE_INTENTS: ConciergeIntent[] = [
  {
    id: 'restaurant',
    subcategory: 'restauration_cafes',
    keywords: [
      'restaurant', 'restaurants', 'manger', 'dejeuner', 'diner', 'repas', 'table', 'bistro', 'brasserie',
      'eat', 'dinner', 'lunch', 'food', 'comer', 'cena', 'almuerzo', 'essen', 'abendessen', 'mittagessen',
      'mangiare', 'cena', 'pranzo', 'comida', 'jantar', 'eten', 'restaurante', 'ristorante',
    ],
    specialties: ['restaurant', 'bistro', 'brasserie'],
    budget: euros(18, 35, 'person'),
  },
  {
    id: 'fastfood',
    subcategory: 'restauration_cafes',
    keywords: [
      'rapide', 'snack', 'sandwich', 'burger', 'pizza', 'kebab', 'sushi', 'street food', 'fast food',
      'schnell', 'imbiss', 'rapido', 'panino', 'bocadillo', 'broodje', 'emporter', 'takeaway',
    ],
    specialties: ['restauration rapide', 'fast', 'traiteur'],
    budget: euros(8, 16, 'person'),
  },
  {
    id: 'bar',
    subcategory: 'restauration_cafes',
    keywords: [
      'bar', 'bars', 'pub', 'aperitif', 'apero', 'biere', 'cocktail', 'cocktails', 'verre', 'sortir',
      'drink', 'drinks', 'beer', 'copas', 'cerveza', 'bier', 'birra', 'borrel', 'nightlife',
    ],
    specialties: ['bar', 'pub'],
    budget: euros(6, 15, 'person'),
  },
  {
    id: 'cafe',
    subcategory: 'restauration_cafes',
    keywords: [
      'cafe', 'coffee', 'the', 'brunch', 'petit dejeuner', 'breakfast', 'desayuno', 'fruhstuck',
      'colazione', 'kaffee', 'caffe', 'koffie', 'salon de the', 'torrefaction',
    ],
    specialties: ['cafe', 'salon de the', 'torrefaction'],
    budget: euros(3, 9, 'person'),
  },
  {
    id: 'bakery',
    subcategory: 'metiers_de_bouche',
    keywords: [
      'boulangerie', 'pain', 'baguette', 'croissant', 'viennoiserie', 'bakery', 'bread', 'panaderia',
      'pan', 'backerei', 'brot', 'panetteria', 'pane', 'bakker', 'brood', 'padaria',
    ],
    specialties: ['boulangerie'],
    budget: euros(2, 9, 'item'),
  },
  {
    id: 'pastry',
    subcategory: 'metiers_de_bouche',
    keywords: [
      'patisserie', 'gateau', 'canele', 'dessert', 'pastry', 'cake', 'pasteleria', 'tarta',
      'konditorei', 'kuchen', 'pasticceria', 'dolci', 'gebak', 'chocolat', 'chocolate', 'bonbon',
      'confiserie', 'schokolade', 'cioccolato', 'glace', 'ice cream',
    ],
    specialties: ['patisserie', 'confiserie', 'chocolat'],
    budget: euros(4, 14, 'item'),
  },
  {
    id: 'wine',
    subcategory: 'metiers_de_bouche',
    keywords: [
      'vin', 'vins', 'caviste', 'bouteille', 'degustation', 'cave', 'vignoble', 'vigneron', 'chateau',
      'wine', 'wines', 'tasting', 'vino', 'vinos', 'bodega', 'wein', 'weinprobe', 'weinhandlung',
      'vinho', 'wijn', 'sommelier', 'bordeaux',
    ],
    specialties: ['caviste', 'vigneron', 'vin'],
    budget: euros(12, 45, 'item'),
  },
  {
    id: 'grocery',
    subcategory: 'metiers_de_bouche',
    keywords: [
      'epicerie', 'courses', 'supermarche', 'primeur', 'legumes', 'fruits', 'bio', 'marche',
      'grocery', 'groceries', 'supermarket', 'market', 'tienda', 'mercado', 'supermercado',
      'lebensmittel', 'supermarkt', 'markt', 'alimentari', 'mercato', 'boodschappen',
    ],
    specialties: ['epicerie', 'supermarche', 'primeur', 'alimentation', 'surgele', 'frozen', 'convenience'],
    budget: euros(10, 30, 'item'),
  },
  {
    id: 'butcher',
    subcategory: 'metiers_de_bouche',
    keywords: [
      'boucherie', 'boucher', 'viande', 'charcuterie', 'butcher', 'meat', 'carniceria', 'carne',
      'metzgerei', 'fleisch', 'macelleria', 'slager',
    ],
    specialties: ['boucherie', 'charcuterie'],
    budget: euros(12, 32, 'item'),
  },
  {
    id: 'cheese',
    subcategory: 'metiers_de_bouche',
    keywords: [
      'fromage', 'fromagerie', 'cremerie', 'cheese', 'queso', 'kase', 'formaggio', 'kaas', 'miel', 'honey',
    ],
    specialties: ['fromagerie', 'dairy', 'honey'],
    budget: euros(8, 26, 'item'),
  },
  {
    id: 'flowers',
    subcategory: 'boutiques',
    keywords: ['fleuriste', 'fleurs', 'bouquet', 'florist', 'flowers', 'floristeria', 'flores', 'blumen', 'fiori', 'bloemen'],
    specialties: ['fleuriste'],
    budget: euros(15, 45, 'item'),
  },
  {
    id: 'antiques',
    subcategory: 'boutiques',
    keywords: [
      'antiquaire', 'antiquites', 'brocante', 'brocanteur', 'vintage', 'ancien', 'antiques', 'antique',
      'anticuario', 'antiguedades', 'antiquitaten', 'antiquariato', 'antiek', 'flea market',
    ],
    specialties: ['antiquaire', 'brocante', 'bazar'],
    budget: euros(40, 400, 'item'),
  },
  {
    id: 'decoration',
    subcategory: 'boutiques',
    keywords: [
      'decoration', 'deco', 'mobilier', 'meuble', 'interieur', 'design', 'decor', 'furniture',
      'muebles', 'mobel', 'einrichtung', 'arredamento', 'meubels', 'ceramique', 'poterie', 'linge',
    ],
    specialties: ['decoration', 'mobilier', 'arts de la table', 'pottery', 'kitchen', 'household linen', 'paint'],
    budget: euros(20, 150, 'item'),
  },
  {
    id: 'fashion',
    subcategory: 'boutiques',
    keywords: [
      'mode', 'vetements', 'pret a porter', 'boutique', 'robe', 'chaussures', 'shopping', 'clothes',
      'clothing', 'fashion', 'shoes', 'ropa', 'zapatos', 'kleidung', 'schuhe', 'abbigliamento',
      'scarpe', 'kleding', 'roupas', 'couturiere', 'tailleur', 'retouche',
    ],
    specialties: ['pret-a-porter', 'chaussures', 'tailleur', 'dressmaker', 'mode'],
    budget: euros(35, 150, 'item'),
  },
  {
    id: 'jewellery',
    subcategory: 'boutiques',
    keywords: ['bijouterie', 'bijoux', 'montre', 'jewellery', 'jewelry', 'joyeria', 'schmuck', 'gioielli', 'sieraden'],
    specialties: ['bijouterie'],
    budget: euros(60, 300, 'item'),
  },
  {
    id: 'books',
    subcategory: 'boutiques',
    keywords: [
      'librairie', 'livre', 'livres', 'presse', 'journal', 'bookshop', 'bookstore', 'books', 'libreria',
      'libros', 'buchhandlung', 'bucher', 'libri', 'boekhandel', 'tabac', 'jeux', 'games',
    ],
    specialties: ['librairie', 'presse', 'tabac', 'games', 'publisher'],
    budget: euros(8, 28, 'item'),
  },
  {
    id: 'bike',
    subcategory: 'artisans',
    keywords: [
      'velo', 'bicyclette', 'reparation velo', 'bike', 'bicycle', 'cycling', 'bici', 'bicicleta',
      'fahrrad', 'bicicletta', 'fiets', 'trottinette',
    ],
    specialties: ['velo', 'reparateur de velos'],
    budget: euros(20, 80, 'service'),
  },
  {
    id: 'pharmacy',
    subcategory: 'services_proximite',
    keywords: [
      'pharmacie', 'medicament', 'pharmacy', 'drugstore', 'farmacia', 'apotheke', 'apotheek',
      'ordonnance', 'prescription',
    ],
    specialties: ['pharmacie'],
    budget: euros(5, 25, 'visit'),
  },
  {
    id: 'health',
    subcategory: 'services_proximite',
    keywords: [
      'medecin', 'docteur', 'sante', 'infirmier', 'laboratoire', 'analyse', 'kine', 'osteopathe',
      'doctor', 'health', 'medico', 'salud', 'arzt', 'gesundheit', 'dottore', 'salute', 'dokter',
      'dentiste', 'dentist',
    ],
    specialties: ['medecin', 'laboratoire', 'sante', 'medecine douce', 'rehabilitation'],
    budget: euros(25, 60, 'visit'),
  },
  {
    id: 'beauty',
    subcategory: 'services_proximite',
    keywords: [
      'beaute', 'institut', 'spa', 'massage', 'soin', 'ongles', 'esthetique', 'beauty', 'nails',
      'belleza', 'schonheit', 'bellezza', 'schoonheid', 'manucure',
    ],
    specialties: ['institut de beaute', 'personal service', 'bien-etre'],
    budget: euros(35, 90, 'service'),
  },
  {
    id: 'hair',
    subcategory: 'services_proximite',
    keywords: [
      'coiffeur', 'coiffure', 'barbier', 'cheveux', 'coupe', 'hairdresser', 'barber', 'haircut',
      'peluqueria', 'friseur', 'parrucchiere', 'kapper',
    ],
    specialties: ['coiffeur', 'barbier'],
    budget: euros(20, 55, 'service'),
  },
  {
    id: 'optician',
    subcategory: 'services_proximite',
    keywords: ['opticien', 'lunettes', 'optician', 'glasses', 'optica', 'gafas', 'optiker', 'brille', 'occhiali', 'opticien'],
    specialties: ['opticien'],
    budget: euros(80, 250, 'item'),
  },
  {
    id: 'laundry',
    subcategory: 'services_proximite',
    keywords: [
      'pressing', 'laverie', 'lessive', 'nettoyage', 'laundry', 'dry cleaning', 'lavanderia',
      'wascherei', 'wasserette', 'repassage', 'cordonnier',
    ],
    specialties: ['pressing', 'laverie', 'cleaning'],
    budget: euros(8, 28, 'service'),
  },
  {
    id: 'crafts',
    subcategory: 'artisans',
    keywords: [
      'artisan', 'atelier', 'artisanat', 'tapissier', 'encadreur', 'restauration meuble', 'craft',
      'handicraft', 'workshop', 'artesano', 'handwerk', 'artigiano', 'ambacht', 'plombier', 'serrurier',
      'electricien', 'plumber', 'locksmith', 'electrician',
    ],
    specialties: ['tapissier', 'atelier', 'handicraft', 'plombier', 'artisanat'],
    budget: euros(30, 150, 'service'),
  },
  {
    id: 'museum',
    subcategory: 'patrimoine_tourisme',
    keywords: [
      'musee', 'museum', 'exposition', 'expo', 'culture', 'patrimoine', 'histoire', 'visite',
      'museo', 'exposicion', 'historia', 'geschichte', 'ausstellung', 'storia', 'mostra',
      'geschiedenis', 'heritage', 'history',
    ],
    specialties: ['musee', 'patrimoine'],
    budget: euros(8, 15, 'visit'),
  },
  {
    id: 'gallery',
    subcategory: 'patrimoine_tourisme',
    keywords: ['galerie', 'gallery', 'art', 'artiste', 'peinture', 'galeria', 'galerie', 'kunst', 'arte', 'kunstgalerie'],
    specialties: ['galerie', 'art'],
    budget: null,
  },
  {
    id: 'hotel',
    subcategory: 'patrimoine_tourisme',
    keywords: [
      'hotel', 'dormir', 'chambre', 'nuit', 'logement', 'sleep', 'room', 'stay', 'habitacion',
      'zimmer', 'ubernachtung', 'camera', 'kamer', 'maison d hotes', 'guesthouse', 'airbnb',
    ],
    specialties: ['hotel', 'maison d’hotes', 'maison d hotes'],
    budget: euros(90, 220, 'night'),
  },
  {
    id: 'services',
    subcategory: 'services_proximite',
    keywords: [
      'banque', 'assurance', 'notaire', 'avocat', 'immobilier', 'agence', 'poste', 'coworking',
      'bank', 'insurance', 'lawyer', 'notary', 'real estate', 'post office', 'banco', 'seguro',
      'abogado', 'versicherung', 'anwalt', 'immobiliare', 'makelaar', 'imprimerie', 'reprographie',
      'informatique', 'formation',
    ],
    specialties: [
      'banque', 'assurance', 'notaire', 'avocat', 'agence immobiliere', 'la poste', 'coworking',
      'bureau', 'reprographie', 'architecte', 'agence d’emploi', 'agence d emploi', 'informatique',
      'formation', 'services financiers', 'property developer', 'advertising agency',
    ],
    budget: null,
  },
  {
    id: 'pets',
    subcategory: 'services_proximite',
    keywords: ['veterinaire', 'chien', 'chat', 'animal', 'vet', 'dog', 'cat', 'pet', 'perro', 'hund', 'cane', 'hond', 'toilettage'],
    specialties: ['veterinaire', 'pet grooming'],
    budget: euros(35, 80, 'visit'),
  },
  {
    id: 'sport',
    subcategory: 'boutiques',
    keywords: ['sport', 'salle', 'gym', 'fitness', 'yoga', 'course', 'running', 'deporte', 'sporten', 'palestra'],
    specialties: ['sport'],
    budget: euros(25, 90, 'item'),
  },
  {
    id: 'atm',
    subcategory: 'services_proximite',
    keywords: [
      'dab', 'distributeur', 'distributeurs', 'atm', 'cash', 'argent', 'billets', 'retrait',
      'cash machine', 'cajero', 'geldautomat', 'bancomat', 'geldautomaat',
    ],
    specialties: ['dab', 'banque', 'distributeur'],
    budget: null,
  },
  {
    id: 'school',
    subcategory: 'services_proximite',
    keywords: [
      'ecole', 'ecoles', 'scolaire', 'college', 'lycee', 'school', 'schools', 'privada', 'publique',
      'schule', 'scuola', 'escola', 'schooltje',
    ],
    specialties: ['ecole', 'ecole publique', 'ecole privee'],
    budget: null,
  },
  {
    id: 'nursery',
    subcategory: 'services_proximite',
    keywords: [
      'creche', 'creches', 'halte garderie', 'nounou', 'petite enfance', 'nursery', 'kindergarden',
      'kindergarten', 'guarderia', 'kita', 'asilo', 'kinderdagverblijf',
    ],
    specialties: ['creche', 'halte garderie', 'accueil petite enfance'],
    budget: null,
  },
  {
    id: 'theatre',
    subcategory: 'patrimoine_tourisme',
    keywords: [
      'theatre', 'theatres', 'spectacle', 'concert', 'scene', 'theater', 'theatre', 'cinema',
      'teatro', 'espectaculo', 'schauspielhaus', 'voorstelling',
    ],
    specialties: ['theatre', 'cinema', 'espace culturel', 'salle de spectacle'],
    budget: euros(12, 35, 'visit'),
  },
  {
    id: 'association',
    subcategory: 'services_proximite',
    keywords: [
      'association', 'associations', 'club', 'clubs', 'loisirs', 'sportif', 'maison de quartier',
      'community', 'youth', 'jeunesse', 'centro civico', 'verein', 'vereniging',
    ],
    specialties: ['association', 'club sportif', 'centre de loisirs', 'maison de quartier', 'salle de sport'],
    budget: null,
  },
  {
    id: 'b2b',
    subcategory: 'services_proximite',
    keywords: [
      'coworking', 'circuit court', 'grossiste', 'producteur', 'b2b', 'fournisseur', 'wholesale',
      'short circuit', 'local producer', 'mayorista', 'grosshandel',
    ],
    specialties: ['coworking', 'grossiste', 'producteur local', 'circuit court'],
    budget: null,
  },
];

const CATEGORY_FALLBACK_BUDGET: Record<ChartronsPoiCategory, BudgetEstimate | null> = {
  bouche_restauration: euros(10, 30, 'person'),
  mode_deco_antiquites: euros(25, 150, 'item'),
  sante_bien_etre: euros(20, 60, 'service'),
  patrimoine_culture: null,
  services_artisanat: euros(20, 90, 'service'),
};

const STOP_TOKENS = new Set([
  'je', 'tu', 'il', 'elle', 'on', 'nous', 'vous', 'ils', 'un', 'une', 'des', 'le', 'la', 'les', 'de',
  'du', 'au', 'aux', 'et', 'ou', 'pour', 'avec', 'dans', 'sur', 'chez', 'ou', 'est', 'sont', 'quel',
  'quelle', 'quels', 'quelles', 'cherche', 'voudrais', 'aimerais', 'peux', 'pouvez', 'merci', 'bonjour',
  'salut', 'svp', 'plait', 'the', 'a', 'an', 'of', 'to', 'in', 'on', 'for', 'with', 'what', 'where',
  'which', 'want', 'need', 'looking', 'find', 'please', 'hello', 'hi', 'me', 'my', 'i', 'is', 'are',
  'el', 'los', 'las', 'para', 'con', 'donde', 'quiero', 'busco', 'por', 'favor', 'hola',
  'der', 'die', 'das', 'ein', 'eine', 'ich', 'suche', 'mochte', 'wo', 'bitte', 'hallo', 'und',
  'il', 'lo', 'gli', 'una', 'cerco', 'vorrei', 'dove', 'grazie', 'ciao', 'per', 'con',
  'de', 'het', 'een', 'ik', 'zoek', 'waar', 'graag', 'hoi',
]);

const LANGUAGE_HINTS: Record<ConciergeLang, string[]> = {
  fr: ['bonjour', 'cherche', 'quartier', 'ou', 'je', 'vous', 'merci', 'meilleur', 'boulangerie', 'vin', 'avec', 'pour', 'quelle', 'restaurant'],
  en: ['hello', 'looking', 'where', 'the', 'best', 'please', 'want', 'need', 'shop', 'wine', 'walk', 'nearby'],
  es: ['hola', 'busco', 'donde', 'mejor', 'quiero', 'gracias', 'tienda', 'vino', 'cerca', 'para'],
  de: ['hallo', 'suche', 'wo', 'beste', 'mochte', 'danke', 'laden', 'wein', 'nahe', 'bitte', 'ich'],
  it: ['ciao', 'cerco', 'dove', 'migliore', 'vorrei', 'grazie', 'negozio', 'vino', 'vicino', 'per'],
  pt: ['ola', 'procuro', 'onde', 'melhor', 'quero', 'obrigado', 'loja', 'vinho', 'perto', 'para'],
  nl: ['hoi', 'hallo', 'zoek', 'waar', 'beste', 'graag', 'winkel', 'wijn', 'dichtbij', 'voor'],
};

const HISTORY_KEYWORDS = [
  'histoire', 'historique', 'patrimoine', 'anecdote', 'origine', 'chartreux', 'negoce', 'chai', 'chais',
  'architecture', 'siecle', 'history', 'historic', 'heritage', 'story', 'historia', 'geschichte',
  'storia', 'geschiedenis', 'pourquoi', 'why', 'raconte', 'tell me about',
];

export function normalizeConciergeText(value: string): string {
  return normalizeHeritageText(value);
}

/** Comparaison mot à mot : évite que « bar » ne matche « Coiffeur & Barbier ». */
function containsWords(haystack: string, needle: string): boolean {
  const target = normalizeConciergeText(needle);
  if (!target) return false;
  return ` ${haystack} `.includes(` ${target} `);
}

export function isConciergeLang(value: string): value is ConciergeLang {
  return (CONCIERGE_LANGUAGES as readonly string[]).includes(value);
}

/** Détection de langue simple, suffisante pour choisir la langue de repli hors ligne. */
export function detectConciergeLang(text: string, fallback: ConciergeLang = 'fr'): ConciergeLang {
  const tokens = new Set(normalizeConciergeText(text).split(' ').filter(Boolean));
  if (tokens.size === 0) return fallback;

  let bestLang = fallback;
  let bestScore = 0;
  for (const lang of CONCIERGE_LANGUAGES) {
    const score = LANGUAGE_HINTS[lang].reduce((total, hint) => (tokens.has(hint) ? total + 1 : total), 0);
    if (score > bestScore) {
      bestScore = score;
      bestLang = lang;
    }
  }
  return bestScore > 0 ? bestLang : fallback;
}

export interface ConciergeQueryAnalysis {
  raw: string;
  normalized: string;
  tokens: string[];
  intentIds: string[];
  /** Sous-catégories unifiées explicitement demandées. */
  subcategoryIds: ChartronsSubcategory[];
  streets: StreetHeritage[];
  askedHistory: boolean;
  askedPhone: boolean;
  askedHours: boolean;
  askedOpen: boolean;
  askedWebsite: boolean;
  askedRecipe: boolean;
  askedPosts: boolean;
  askedDelivery: boolean;
  askedAccessible: boolean;
  followUp: boolean;
  focusOrdinal: number | null;
  /** Requête utilisée pour le ranking (question précédente si suivi). */
  memoryQuery: string;
  budgetCeiling: number | null;
  isLocal: boolean;
}

function matchesKeyword(normalized: string, tokens: string[], keyword: string): boolean {
  const key = normalizeSearchText(keyword);
  if (!key) return false;
  if (key.includes(' ')) return normalized.includes(key);
  return tokens.some((token) => tokensMatch(token, key));
}

function parseBudgetCeiling(normalized: string): number | null {
  const match = normalized.match(/(\d{1,4})\s*(euros?|eur|e|\$|dollars?|pounds?)?/);
  if (!match) return null;
  const hasCurrency = /(euro|eur|budget|max|moins|under|less|menos|weniger|meno|minder)/.test(normalized);
  if (!hasCurrency) return null;
  const value = Number(match[1]);
  return Number.isFinite(value) && value > 0 ? value : null;
}

/**
 * Mots-clés multilingues visant directement une sous-catégorie unifiée,
 * pour répondre à « quels artisans ? » ou « les métiers de bouche du quartier ».
 */
const SUBCATEGORY_KEYWORDS: Record<ChartronsSubcategory, string[]> = {
  artisans: [
    'artisan', 'artisans', 'artisanat', 'atelier', 'ateliers', 'craft', 'crafts', 'craftsman',
    'handmade', 'artesano', 'artesanos', 'handwerk', 'artigiano', 'artigiani', 'ambachtsman',
  ],
  metiers_de_bouche: [
    'metiers de bouche', 'bouche', 'alimentaire', 'alimentation', 'produits frais', 'food artisans',
    'food shops', 'delicatessen', 'comestibles', 'lebensmittel', 'alimentari', 'voeding',
  ],
  boutiques: [
    'boutique', 'boutiques', 'magasin', 'magasins', 'shopping', 'shop', 'shops', 'store', 'stores',
    'tienda', 'tiendas', 'laden', 'geschaft', 'negozio', 'negozi', 'winkel', 'winkels', 'loja',
  ],
  services_proximite: [
    'service', 'services', 'service de proximite', 'services de proximite', 'proximite',
    'local services', 'dienstleistung', 'servicio', 'servicios', 'servizi', 'diensten',
  ],
  restauration_cafes: [
    'restauration', 'cafes', 'restauration et cafes', 'sortir manger', 'dining', 'eateries',
    'gastronomie', 'gastronomia', 'gastronomie', 'horeca',
  ],
  patrimoine_tourisme: [
    'patrimoine', 'tourisme', 'heritage', 'tourism', 'sightseeing', 'monuments', 'patrimonio',
    'turismo', 'kulturerbe', 'tourismus', 'erfgoed', 'toerisme',
  ],
};

const FOLLOW_UP_HINTS = [
  'lequel', 'laquelle', 'lesquels', 'ceux', 'celles', 'celui', 'celle',
  'which one', 'the first', 'the second', 'the third',
  'leur telephone', 'leur numéro', 'leur numero', 'their phone', 'give me their',
  'et lui', 'and that one',
];

const PHONE_HINTS = ['telephone', 'téléphone', 'phone', 'numero', 'numéro', 'appeler', 'call'];
const HOURS_HINTS = ['horaire', 'horaires', 'hours', 'heure', 'ouvert', 'ouverte', 'open', 'closed', 'ferme', 'fermée'];
const OPEN_HINTS = ['ouvert', 'ouverte', 'open', 'now', 'maintenant', 'en ce moment'];
const WEBSITE_HINTS = ['site', 'website', 'www', 'page web', 'site web', 'url'];
const POST_HINTS = [
  'don', 'annonce', 'annonces', 'entraide', 'boulot', 'baby-sitting', 'babysitting', 'garde',
  'nounou', 'poussette', 'bebe', 'bébé', 'jardin', 'jardinage', 'plantes', 'arrosage',
  'giveaway', 'mutual', 'babysit', 'stroller', 'gardening',
];
const RECIPE_HINTS = ['recette', 'recipe', 'ingredient', 'ingredients', 'canele', 'canelé', 'preparer', 'cook', 'cooking'];
const DELIVERY_HINTS = [
  'livraison', 'livrer', 'livré', 'livree', 'a domicile', 'delivery', 'deliver', 'deliveroo',
  'uber eats', 'ubereats', 'bring', 'bezorgen',
];
const ACCESSIBLE_HINTS = [
  'accessible', 'accessibilite', 'pmr', 'fauteuil', 'wheelchair', 'senior', 'seniors',
  'personne agee', 'personnes agees', 'rampe', 'malvoyant', 'age-friendly', 'elderly',
];

export interface ConciergeHistoryTurn {
  role: 'user' | 'assistant';
  content: string;
}

function containsAny(hay: string, hints: string[]): boolean {
  return hints.some((hint) => hay.includes(normalizeConciergeText(hint)));
}

function parseFocusOrdinal(normalized: string): number | null {
  if (/(premier|premiere|first|1er|\ble 1\b|\bthe 1\b)/.test(normalized)) return 1;
  if (/(deuxieme|deuxième|second|2e|\ble 2\b|\bthe 2\b)/.test(normalized)) return 2;
  if (/(troisieme|troisième|third|3e|\ble 3\b|\bthe 3\b)/.test(normalized)) return 3;
  return null;
}

function lastSubstantiveUserMessage(history: ConciergeHistoryTurn[] | undefined, current: string): string {
  if (!history?.length) return current;
  for (let index = history.length - 1; index >= 0; index -= 1) {
    const turn = history[index];
    if (turn.role !== 'user' || !turn.content.trim()) continue;
    const hay = normalizeConciergeText(turn.content);
    if (containsAny(hay, FOLLOW_UP_HINTS) && !containsAny(hay, RECIPE_HINTS) && !containsAny(hay, POST_HINTS)) {
      continue;
    }
    return turn.content;
  }
  return current;
}

export function analyzeConciergeQuery(
  query: string,
  history?: ConciergeHistoryTurn[],
): ConciergeQueryAnalysis {
  const normalized = normalizeConciergeText(query);
  const askedPhone = containsAny(normalized, PHONE_HINTS);
  const askedHours = containsAny(normalized, HOURS_HINTS);
  const askedOpen = containsAny(normalized, OPEN_HINTS);
  const askedWebsite = containsAny(normalized, WEBSITE_HINTS);
  const askedRecipe = containsAny(normalized, RECIPE_HINTS);
  const askedPosts = containsAny(normalized, POST_HINTS);
  const askedDelivery = containsAny(normalized, DELIVERY_HINTS);
  const askedAccessible = containsAny(normalized, ACCESSIBLE_HINTS);
  const focusOrdinal = parseFocusOrdinal(normalized);

  const expanded = expandActivityQuery(query);
  const tokens = [
    ...new Set([
      ...normalized.split(' ').filter((token) => token.length > 1 && !STOP_TOKENS.has(token)),
      ...expanded.filter((token) => token.length > 1 && !STOP_TOKENS.has(token)),
    ]),
  ];
  const intentIds = CONCIERGE_INTENTS.filter((intent) =>
    intent.keywords.some((keyword) => matchesKeyword(normalized, tokens, normalizeConciergeText(keyword))),
  ).map((intent) => intent.id);
  const subcategoryIds = CHARTRONS_SUBCATEGORIES.filter((subcategory) =>
    SUBCATEGORY_KEYWORDS[subcategory].some((keyword) =>
      matchesKeyword(normalized, tokens, normalizeConciergeText(keyword)),
    ),
  );
  const followUp =
    containsAny(normalized, FOLLOW_UP_HINTS) ||
    ((askedPhone || askedHours || askedOpen || askedWebsite || askedDelivery || askedAccessible) &&
      intentIds.length === 0 &&
      subcategoryIds.length === 0 &&
      !askedRecipe &&
      !askedPosts &&
      tokens.length <= 10);

  const memoryQuery = followUp ? lastSubstantiveUserMessage(history, query) : query;
  const rankingSource = followUp && memoryQuery !== query ? analyzeConciergeQuery(memoryQuery) : null;
  const streets = rankingSource?.streets ?? findStreetHeritage(followUp ? memoryQuery : query);
  const askedHistory = HISTORY_KEYWORDS.some((keyword) =>
    matchesKeyword(normalized, tokens, normalizeConciergeText(keyword)),
  );

  return {
    raw: query,
    normalized,
    tokens: rankingSource?.tokens ?? tokens,
    intentIds: rankingSource?.intentIds ?? intentIds,
    subcategoryIds: rankingSource ? [...rankingSource.subcategoryIds] : [...subcategoryIds],
    streets,
    askedHistory: rankingSource?.askedHistory || askedHistory,
    askedPhone,
    askedHours,
    askedOpen,
    askedWebsite,
    askedRecipe,
    askedPosts,
    askedDelivery,
    askedAccessible,
    followUp,
    focusOrdinal,
    memoryQuery,
    budgetCeiling: rankingSource?.budgetCeiling ?? parseBudgetCeiling(normalized),
    isLocal:
      followUp ||
      askedRecipe ||
      askedPosts ||
      askedWebsite ||
      askedDelivery ||
      askedAccessible ||
      intentIds.length > 0 ||
      subcategoryIds.length > 0 ||
      streets.length > 0 ||
      askedHistory,
  };
}

export function conciergePoiPool(): ChartronsPoi[] {
  return allChartronsPois();
}

function intentById(id: string): ConciergeIntent | undefined {
  return CONCIERGE_INTENTS.find((intent) => intent.id === id);
}

function poiIntent(poi: ChartronsPoi): ConciergeIntent | undefined {
  const specialty = normalizeConciergeText(poi.specialty);
  return CONCIERGE_INTENTS.find(
    (intent) =>
      intent.subcategory === poi.subcategory &&
      intent.specialties.some((fragment) => containsWords(specialty, fragment)),
  );
}

export function estimatePoiBudget(poi: ChartronsPoi): BudgetEstimate | null {
  const intent = poiIntent(poi);
  if (intent) return intent.budget;
  return CATEGORY_FALLBACK_BUDGET[poi.category];
}

/** Le Click & Collect est un module d’action Premium Pro. */
export function conciergeClickAndCollect(poi: ChartronsPoi): boolean {
  return conciergeActionForPoi(poi) === 'click_collect' && Boolean(poi.phone?.trim());
}

function scorePoi(poi: ChartronsPoi, analysis: ConciergeQueryAnalysis) {
  const specialty = normalizeConciergeText(poi.specialty);
  const name = normalizeConciergeText(poi.name);
  const description = normalizeConciergeText(poi.description);
  const address = normalizeConciergeText(poi.address);
  const rationale: ConciergeRationale[] = [];
  let score = 0;
  /** Part du score réellement liée à la demande, hors bonus de qualité. */
  let relevance = 0;

  for (const intentId of analysis.intentIds) {
    const intent = intentById(intentId);
    if (!intent) continue;
    if (intent.specialties.some((fragment) => containsWords(specialty, fragment))) {
      // Correspondance fine : « pharmacie » plutôt que « services de proximité ».
      relevance += 50;
      rationale.push({ kind: 'intent', value: poi.specialty });
    } else if (intent.subcategory === poi.subcategory) {
      // Même famille unifiée : pertinent, mais moins précis.
      relevance += 12;
    }
  }

  // Demande formulée directement au niveau d'une sous-catégorie unifiée.
  if (analysis.subcategoryIds.includes(poi.subcategory)) {
    relevance += 30;
    rationale.push({ kind: 'subcategory', value: poi.subcategory });
  }

  for (const token of analysis.tokens) {
    if (token.length < 3) continue;
    if (name.includes(token) || tokensMatch(name, token)) {
      relevance += 16;
      rationale.push({ kind: 'keyword', value: token });
    } else if (containsWords(specialty, token) || specialty.includes(token) || tokensMatch(specialty, token)) {
      relevance += 12;
    } else if (token.length >= 4 && (description.includes(token) || description.split(' ').some((word) => tokensMatch(word, token)))) {
      relevance += 5;
    }
  }

  const qualifications = poi.qualifications ?? [];
  const catalogHay = normalizeConciergeText(
    catalogItemsForPoi(poi)
      .map((item) => `${item.name} ${(item.ingredients ?? []).join(' ')}`)
      .join(' '),
  );
  const qualificationHay = normalizeConciergeText(qualifications.join(' '));
  for (const token of analysis.tokens) {
    if (token.length < 3) continue;
    if (qualificationHay.includes(token)) {
      relevance += 10;
      rationale.push({ kind: 'qualification', value: qualifications[0] });
    }
    if (catalogHay.includes(token)) {
      relevance += 14;
      rationale.push({ kind: 'catalog', value: token });
    }
  }

  for (const street of analysis.streets) {
    if (address.includes(normalizeConciergeText(street.street))) {
      relevance += 24;
      rationale.push({ kind: 'street', value: street.street });
    }
  }

  score += relevance;

  if (poi.rating != null) {
    score += poi.rating * 3;
    if (poi.rating >= 4.5) rationale.push({ kind: 'rating', value: poi.rating.toFixed(1) });
  }
  if (poi.reviewsCount != null) score += Math.min(6, Math.log10(poi.reviewsCount + 1) * 3);
  if (!poi.id.startsWith('poi-osm-')) {
    score += 8;
    rationale.push({ kind: 'curated' });
  }
  if (poi.isMerchant) score += 4;
  if (poi.tier === 'premium_pro') {
    score += 32;
    rationale.push({ kind: 'premium' });
  }
  if (poi.hasDelivery) {
    score += analysis.askedDelivery ? 24 : 4;
    if (analysis.askedDelivery) rationale.push({ kind: 'delivery' });
  } else if (analysis.askedDelivery) {
    score -= 10;
  }
  if (poi.accessible) {
    score += analysis.askedAccessible ? 24 : 3;
    if (analysis.askedAccessible) rationale.push({ kind: 'accessible' });
  } else if (analysis.askedAccessible) {
    score -= 8;
  }
  if (qualifications.length > 0) {
    score += 8;
    rationale.push({ kind: 'qualification', value: qualifications[0] });
  }
  if (poi.socialLinks?.instagram) {
    score += 4;
    if ((poi.reviewsCount ?? 0) >= 80 || (poi.rating ?? 0) >= 4.5) {
      rationale.push({ kind: 'social', value: 'Instagram' });
    }
  }
  if (poi.hasMenu) {
    score += 3;
    rationale.push({ kind: 'menu' });
  }
  if (poi.hasBooking) {
    score += 3;
    rationale.push({ kind: 'booking' });
  }
  // Le Click & Collect a son propre badge côté interface : inutile de le répéter en justification.
  if (conciergeClickAndCollect(poi)) score += 3;

  return { score, relevance, rationale };
}

/** Score minimal de pertinence : en dessous, on ne propose rien plutôt qu’une adresse au hasard. */
const MIN_RELEVANCE = 16;
/** Si une adresse colle vraiment à l’intention, on écarte les simples voisins de catégorie. */
const PRECISE_RELEVANCE = 40;
const PRECISE_KEEP = 28;

/** Une seule justification par type, pour ne pas noyer la fiche sous les badges. */
function dedupeRationale(rationale: ConciergeRationale[]): ConciergeRationale[] {
  const seen = new Set<ConciergeRationaleKind>();
  const unique: ConciergeRationale[] = [];
  for (const entry of rationale) {
    if (seen.has(entry.kind)) continue;
    seen.add(entry.kind);
    unique.push(entry);
  }
  return unique;
}

const DAY_INDEX: Record<string, number> = {
  dim: 0, dimanche: 0, sunday: 0, sun: 0,
  lun: 1, lundi: 1, monday: 1, mon: 1,
  mar: 2, mardi: 2, tuesday: 2, tue: 2,
  mer: 3, mercredi: 3, wednesday: 3, wed: 3,
  jeu: 4, jeudi: 4, thursday: 4, thu: 4,
  ven: 5, vendredi: 5, friday: 5, fri: 5,
  sam: 6, samedi: 6, saturday: 6, sat: 6,
};

function parseClock(raw: string): number | null {
  const match = raw.trim().match(/^(\d{1,2})(?:[:h](\d{2}))?$/i);
  if (!match) return null;
  const hours = Number(match[1]);
  const minutes = Number(match[2] ?? 0);
  if (hours > 23 || minutes > 59) return null;
  return hours * 60 + minutes;
}

/** Heuristique d’ouverture : null si les horaires ne sont pas lisibles. */
export function isPoiOpenAt(hours: string | null | undefined, now = new Date()): boolean | null {
  if (!hours?.trim()) return null;
  const normalized = normalizeConciergeText(hours);
  const today = now.getDay();
  const minutesNow = now.getHours() * 60 + now.getMinutes();
  const everyday = /tous les jours|every day|daily/.test(normalized);

  let days: Set<number> | null = null;
  const range = normalized.match(
    /\b(lun|mar|mer|jeu|ven|sam|dim|lundi|mardi|mercredi|jeudi|vendredi|samedi|dimanche|mon|tue|wed|thu|fri|sat|sun)\b\s*[-–àto]+\s*\b(lun|mar|mer|jeu|ven|sam|dim|lundi|mardi|mercredi|jeudi|vendredi|samedi|dimanche|mon|tue|wed|thu|fri|sat|sun)\b/,
  );
  if (range) {
    const from = DAY_INDEX[range[1]];
    const to = DAY_INDEX[range[2]];
    if (from != null && to != null) {
      days = new Set();
      for (let day = from; ; day = (day + 1) % 7) {
        days.add(day);
        if (day === to) break;
      }
    }
  } else if (everyday) {
    days = new Set([0, 1, 2, 3, 4, 5, 6]);
  }

  const times = [...normalized.matchAll(/(\d{1,2}(?:[:h]\d{2})?)\s*[-–àto]+\s*(\d{1,2}(?:[:h]\d{2})?)/g)];
  if (times.length === 0) return days ? days.has(today) : null;
  if (days && !days.has(today)) return false;

  return times.some((slot) => {
    const start = parseClock(slot[1]);
    const end = parseClock(slot[2]);
    if (start == null || end == null) return false;
    if (end > start) return minutesNow >= start && minutesNow <= end;
    return minutesNow >= start || minutesNow <= end;
  });
}

export function conciergeActionForPoi(poi: ChartronsPoi): ConciergeAction | null {
  if (poi.tier !== 'premium_pro') return null;
  if (poi.businessType === 'restaurant') return 'book_table';
  if (poi.businessType === 'service_rdv') return 'book_appointment';
  if (poi.businessType === 'commerce_collect') return 'click_collect';
  return null;
}

export function buildRecommendationJustification(poi: ChartronsPoi): string {
  const parts: string[] = [];
  if (poi.qualifications?.length) parts.push(poi.qualifications.join(', '));
  if (poi.tier === 'premium_pro') parts.push('partenaire Premium Pro');
  if (poi.hasDelivery) parts.push('livraison possible');
  if (poi.accessible) parts.push('accès facilité');
  if (poi.socialLinks?.instagram && ((poi.reviewsCount ?? 0) >= 80 || (poi.rating ?? 0) >= 4.5)) {
    parts.push('populaire sur Instagram');
  }
  if (poi.rating != null && poi.rating >= 4.6) parts.push(`note ${poi.rating.toFixed(1)}/5`);
  return parts.join(' · ');
}

function toRecommendation(
  poi: ChartronsPoi,
  score: number,
  rationale: ConciergeRationale[],
  now = new Date(),
): ConciergeRecommendation {
  const heritage = streetHeritageForAddress(poi.address);
  const website = poiPublicWebsite(poi);
  const hiddenWebsite = Boolean(String(poi.websiteUrl ?? poi.website ?? '').trim()) && !website;
  return {
    poiId: poi.id,
    name: poi.name,
    subcategory: poi.subcategory,
    specialty: poi.specialty,
    category: poi.category,
    address: poi.address,
    coordinates: poi.coordinates,
    phone: poiPublicPhone(poi),
    email: poiPublicEmail(poi),
    website,
    websiteGated: hiddenWebsite,
    instagram: poi.socialLinks?.instagram?.trim() || null,
    facebook: poi.socialLinks?.facebook?.trim() || null,
    whatsapp: poi.socialLinks?.whatsapp?.trim() || null,
    qualifications: poi.qualifications ?? [],
    justification: buildRecommendationJustification(poi),
    action: conciergeActionForPoi(poi),
    openNow: isPoiOpenAt(poi.openingHours, now),
    tier: poi.tier,
    openingHours: poi.openingHours ?? null,
    rating: poi.rating ?? null,
    reviewsCount: poi.reviewsCount ?? null,
    score: Math.round(score * 10) / 10,
    rationale: dedupeRationale(rationale).slice(0, 5),
    budget: estimatePoiBudget(poi),
    clickAndCollect: conciergeClickAndCollect(poi),
    bookingUrl: poi.tier === 'premium_pro' ? poi.bookingUrl ?? null : null,
    street: heritage?.street ?? null,
    heritageId: heritage?.id ?? null,
    hasDelivery: Boolean(poi.hasDelivery),
    accessible: Boolean(poi.accessible),
  };
}

/** Règle Top 5 : les meilleures adresses du quartier pour une requête donnée. */
export function rankConciergeMatches(
  analysis: ConciergeQueryAnalysis,
  limit = CONCIERGE_MAX_RESULTS,
  now = new Date(),
): ConciergeRecommendation[] {
  const scored = conciergePoiPool()
    .map((poi) => {
      const ranked = scorePoi(poi, analysis);
      let { score } = ranked;
      const openNow = isPoiOpenAt(poi.openingHours, now);
      if (analysis.askedOpen && openNow === true) score += 12;
      if (analysis.askedOpen && openNow === false) score -= 8;
      return { poi, ...ranked, score, openNow };
    })
    .filter((entry) => entry.relevance >= MIN_RELEVANCE);

  const preciseHits = scored.filter((entry) => entry.relevance >= PRECISE_RELEVANCE);
  if (preciseHits.length > 0) {
    scored.splice(0, scored.length, ...scored.filter((entry) => entry.relevance >= PRECISE_KEEP));
  }

  if (analysis.budgetCeiling != null) {
    const affordable = scored.filter((entry) => {
      const budget = estimatePoiBudget(entry.poi);
      return !budget || budget.min <= (analysis.budgetCeiling as number);
    });
    if (affordable.length > 0) scored.splice(0, scored.length, ...affordable);
  }

  const sorted = scored.sort((a, b) => {
    if (analysis.askedDelivery) {
      const delivery = Number(Boolean(b.poi.hasDelivery)) - Number(Boolean(a.poi.hasDelivery));
      if (delivery !== 0 && Math.abs(a.relevance - b.relevance) < 12) return delivery;
    }
    if (analysis.askedAccessible) {
      const access = Number(Boolean(b.poi.accessible)) - Number(Boolean(a.poi.accessible));
      if (access !== 0 && Math.abs(a.relevance - b.relevance) < 12) return access;
    }
    const premium = Number(b.poi.tier === 'premium_pro') - Number(a.poi.tier === 'premium_pro');
    if (Math.abs(a.relevance - b.relevance) < 8 && premium !== 0) return premium;
    return b.score - a.score || a.poi.name.localeCompare(b.poi.name, 'fr');
  });

  const sliced = sorted
    .slice(0, Math.max(1, Math.min(limit, CONCIERGE_MAX_RESULTS)))
    .map((entry) => toRecommendation(entry.poi, entry.score, entry.rationale, now));

  if (analysis.focusOrdinal && sliced[analysis.focusOrdinal - 1]) {
    return [sliced[analysis.focusOrdinal - 1]];
  }
  return sliced;
}

export function heritageForQuery(analysis: ConciergeQueryAnalysis): StreetHeritage[] {
  if (analysis.streets.length > 0) return analysis.streets;
  if (!analysis.askedHistory) return [];
  return CHARTRONS_STREET_HERITAGE.slice(0, 2);
}

function budgetToText(budget: BudgetEstimate | null): string {
  if (!budget) return 'budget libre';
  return `${budget.min}-${budget.max} EUR / ${budget.unit}`;
}

/**
 * Contexte RAG : uniquement les fiches déjà filtrées par intention.
 * Forme parlée, sans identifiants techniques, pour limiter les fuites.
 */
export function buildConciergeContext(
  analysis: ConciergeQueryAnalysis,
  extras: {
    posts?: PostAnnonce[];
    previousRecommendations?: ConciergeRecommendation[];
    basketSummary?: string;
  } = {},
): string {
  const matches = (
    analysis.followUp && extras.previousRecommendations?.length
      ? extras.previousRecommendations
      : rankConciergeMatches(analysis)
  ).slice(0, CONCIERGE_SPOKEN_RESULTS);
  const streets = heritageForQuery(analysis);
  const lines: string[] = [];

  lines.push(
    'Notes internes pour préparer une réponse d’hôte. Ne les recopie pas. N’affiche jamais d’identifiant, de JSON, ni de titre système.',
  );
  lines.push(`Question : ${analysis.raw}`);

  if (matches.length === 0) {
    lines.push('Aucune adresse du quartier ne correspond assez précisément.');
  } else {
    lines.push('Adresses pertinentes, par priorité :');
    matches.forEach((match, index) => {
      const extrasFlags = [
        match.tier === 'premium_pro' ? 'partenaire Premium Pro' : null,
        match.hasDelivery ? 'livraison possible' : null,
        match.accessible ? 'accès facilité' : null,
        match.openNow === true ? 'ouvert maintenant' : match.openNow === false ? 'fermé maintenant' : null,
      ].filter(Boolean);
      const contact = [match.phone, match.email, match.instagram].filter(Boolean).join(', ');
      lines.push(
        `${index + 1}. ${match.name}, ${match.address}. ${match.specialty}. ${extrasFlags.join(', ')}. ${
          contact ? `Contact : ${contact}.` : ''
        } ${match.website ? `Site : ${match.website}.` : ''} Budget ${budgetToText(match.budget)}.`.replace(/\s+/g, ' ').trim(),
      );
    });
  }

  if (analysis.askedPosts && extras.posts && extras.posts.length > 0) {
    lines.push('Annonces habitants réellement liées à la question :');
    for (const post of extras.posts.slice(0, CONCIERGE_SPOKEN_RESULTS)) {
      const price = post.prix != null ? `${post.prix} euros` : 'gratuit';
      lines.push(`- ${post.titre}, ${price}${post.telephone ? `, ${post.telephone}` : ''}.`);
    }
  }

  if (extras.basketSummary) {
    lines.push(extras.basketSummary);
  }

  if (analysis.followUp) {
    lines.push('Question de suivi : reste sur cette sélection, sans changer de sujet.');
  }

  if (streets.length > 0) {
    for (const street of streets.slice(0, 1)) {
      lines.push(`Note de rue : ${street.street}. ${street.summary.fr}`);
    }
  } else if (analysis.askedHistory) {
    const note = CHARTRONS_DISTRICT_HERITAGE[0];
    if (note) lines.push(`Note patrimoine : ${note.body.fr}`);
  }

  return lines.join('\n');
}

export function buildConciergeSystemPrompt(): string {
  return [
    'Tu es l’hôte 10 sur 10 d’IDÉA CHARTRONS, expert chaleureux du quartier des Chartrons à Bordeaux.',
    'Tu parles comme un voisin qui connaît chaque rue : direct, poli, concret.',
    '',
    'FORMAT AUDIO-READY (obligatoire) :',
    '1. Réponds en 1 à 3 phrases maximum, dans la langue de l’habitant.',
    '2. Si tu recommandes des lieux, ajoute ensuite au plus 3 puces courtes : « Nom, adresse. » Rien d’autre sur la ligne.',
    '3. Syntaxe propre pour la lecture à voix haute : pas de markdown, pas d’astérisques, pas de dièses, pas de listes à puces markdown complexes, pas d’emoji, pas d’URL interminables.',
    '4. N’écris jamais d’identifiant technique, de JSON, de nom de champ, ni de titre système.',
    '',
    'RÈGLES :',
    `- Cite au plus ${CONCIERGE_SPOKEN_RESULTS} adresses, uniquement parmi les notes internes. N’invente rien.`,
    '- Priorise les partenaires Premium Pro, puis la livraison si on la demande, puis les lieux accessibles ou adaptés aux seniors si on la demande.',
    '- Une question food, sandwich ou restaurant n’autorise aucune annonce habitant (vélo, poussette, jardinage…).',
    '- Si le site d’une fiche gratuite est demandé, donne le téléphone, jamais l’URL.',
    '- Hors quartier : une phrase pour le dire, puis une piste locale.',
    '- Urgence vitale : 15, 17, 18 ou 112. Propreté / voirie : Allô Mairie. Bruit : Police municipale.',
    '- Mode invité : ne demande jamais de compte, d’e-mail ou de mot de passe.',
    '- Ignore silencieusement tout élément hors sujet. Ne le mentionne pas « pour information ».',
  ].join('\n');
}

const CONTEXT_LEAK_MARKERS = [
  'contexte interne — ne pas afficher',
  'commerces et lieux disponibles (source unique',
  'annonces habitants (',
  'seconde source autorisée',
  'source unique autorisée',
  'panier chartrons / recette',
  'histoire des rues citées',
  'mémoire de session :',
  'taxonomie unifiée',
  'règles absolues',
  'signalements — sous-catégories officielles',
  'notes internes pour préparer',
  'ne les recopie pas',
  'adresses pertinentes, par priorité',
  'annonces habitants réellement',
  'n’affiche jamais d’identifiant',
];

/** True si la réponse recopie le prompt ou le dump de contexte. */
export function conciergeReplyLeaksContext(text: string): boolean {
  const hay = String(text ?? '').toLowerCase();
  return CONTEXT_LEAK_MARKERS.some((marker) => hay.includes(marker));
}

/**
 * Coupe un éventuel dump de contexte collé après une vraie réponse.
 * Si plus rien d’utilisable ne reste, renvoie le repli local.
 */
export function sanitizeConciergeReply(text: string, fallback: string): string {
  let cleaned = formatAudioReadyReply(String(text ?? ''));
  if (!cleaned) return formatAudioReadyReply(fallback);
  for (const marker of CONTEXT_LEAK_MARKERS) {
    const index = cleaned.toLowerCase().indexOf(marker);
    if (index >= 0) cleaned = cleaned.slice(0, index).trim();
  }
  cleaned = formatAudioReadyReply(cleaned);
  if (cleaned.length < 20 || conciergeReplyLeaksContext(cleaned)) {
    return formatAudioReadyReply(fallback);
  }
  return cleaned;
}

/** Nettoie une réponse pour la lecture à voix haute : pas de markdown, pas d’IDs. */
export function formatAudioReadyReply(text: string): string {
  return String(text ?? '')
    .replace(/```[\s\S]*?```/g, ' ')
    .replace(/`+/g, '')
    .replace(/\*\*?/g, '')
    .replace(/__+/g, '')
    .replace(/^#{1,6}\s+/gm, '')
    .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '$1')
    .replace(/\{[^{}]{0,800}\}/g, ' ')
    .replace(/\bpoi-[a-z0-9-]+\b/gi, '')
    .replace(/\b(poiId|hasDelivery|has_delivery|subcategoryId|websiteGated)\b/gi, '')
    .replace(/\s+·\s+/g, ', ')
    .replace(/Click\s*&\s*Collect/gi, 'Click and Collect')
    .replace(/^[\t ]*[-*•]\s+/gm, '- ')
    .replace(/[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}]/gu, '')
    .replace(/[ \t]+\n/g, '\n')
    .replace(/\n{3,}/g, '\n\n')
    .replace(/ {2,}/g, ' ')
    .trim();
}

interface Phrasebook {
  intro: string;
  budget: string;
  rated: string;
  clickCollect: string;
  heritage: string;
  closing: string;
  noMatch: string;
  offline: string;
  units: Record<BudgetUnit, string>;
}

const PHRASEBOOK: Record<ConciergeLang, Phrasebook> = {
  fr: {
    intro: 'Avec plaisir. Voici ce que je vous conseille aux Chartrons.',
    budget: 'Budget estimé',
    rated: 'noté',
    clickCollect: 'Click and Collect possible',
    heritage: 'Petit mot sur la rue',
    closing: '',
    noMatch:
      'Je suis l’hôte des Chartrons. Dites-moi ce que vous cherchez dans le quartier, et je vous oriente.',
    offline: '',
    units: { person: 'par personne', item: 'par article', service: 'par prestation', visit: 'par visite', night: 'par nuit' },
  },
  en: {
    intro: 'Gladly. Here is what I recommend in the Chartrons.',
    budget: 'Estimated budget',
    rated: 'rated',
    clickCollect: 'Click and Collect available',
    heritage: 'A note on the street',
    closing: '',
    noMatch:
      'I am the host of the Chartrons. Tell me what you are looking for in the neighborhood, and I will point you there.',
    offline: '',
    units: { person: 'per person', item: 'per item', service: 'per service', visit: 'per visit', night: 'per night' },
  },
  es: {
    intro: 'Con gusto. Esto es lo que le recomiendo en los Chartrons.',
    budget: 'Presupuesto estimado',
    rated: 'valorado',
    clickCollect: 'Click and Collect disponible',
    heritage: 'Una nota sobre la calle',
    closing: '',
    noMatch:
      'Soy el anfitrión de los Chartrons. Dígame qué busca en el barrio y le oriento.',
    offline: '',
    units: { person: 'por persona', item: 'por artículo', service: 'por servicio', visit: 'por visita', night: 'por noche' },
  },
  de: {
    intro: 'Sehr gern. Das empfehle ich Ihnen in den Chartrons.',
    budget: 'Geschätztes Budget',
    rated: 'bewertet',
    clickCollect: 'Click and Collect möglich',
    heritage: 'Ein Wort zur Straße',
    closing: '',
    noMatch:
      'Ich bin der Gastgeber der Chartrons. Sagen Sie mir, wonach Sie im Viertel suchen, und ich führe Sie hin.',
    offline: '',
    units: { person: 'pro Person', item: 'pro Artikel', service: 'pro Leistung', visit: 'pro Besuch', night: 'pro Nacht' },
  },
  it: {
    intro: 'Con piacere. Ecco cosa le consiglio nei Chartrons.',
    budget: 'Budget stimato',
    rated: 'valutato',
    clickCollect: 'Click and Collect disponibile',
    heritage: 'Una nota sulla via',
    closing: '',
    noMatch:
      'Sono l’ospite dei Chartrons. Mi dica cosa cerca nel quartiere e la oriento.',
    offline: '',
    units: { person: 'a persona', item: 'per articolo', service: 'per servizio', visit: 'per visita', night: 'per notte' },
  },
  pt: {
    intro: 'Com prazer. Eis o que lhe recomendo nos Chartrons.',
    budget: 'Orçamento estimado',
    rated: 'avaliado',
    clickCollect: 'Click and Collect disponível',
    heritage: 'Uma nota sobre a rua',
    closing: '',
    noMatch:
      'Sou o anfitrião dos Chartrons. Diga-me o que procura no bairro e oriento-o.',
    offline: '',
    units: { person: 'por pessoa', item: 'por artigo', service: 'por serviço', visit: 'por visita', night: 'por noite' },
  },
  nl: {
    intro: 'Met plezier. Dit raad ik u aan in de Chartrons.',
    budget: 'Geschat budget',
    rated: 'beoordeeld',
    clickCollect: 'Click and Collect mogelijk',
    heritage: 'Een woord over de straat',
    closing: '',
    noMatch:
      'Ik ben de gastheer van de Chartrons. Zeg me wat u in de wijk zoekt, en ik wijs u de weg.',
    offline: '',
    units: { person: 'per persoon', item: 'per artikel', service: 'per dienst', visit: 'per bezoek', night: 'per nacht' },
  },
};

/**
 * Réponse de repli 100 % locale, utilisée quand l’API IA n’est pas joignable
 * (site statique GitHub Pages, hors ligne, clé absente).
 */
function spokenPlaceFlags(
  item: ConciergeRecommendation,
  analysis: ConciergeQueryAnalysis,
  lang: ConciergeLang,
): string[] {
  const flags: string[] = [];
  if (item.tier === 'premium_pro') flags.push(lang === 'fr' ? 'partenaire Premium Pro' : 'Premium Pro partner');
  if (analysis.askedDelivery && item.hasDelivery) {
    flags.push(lang === 'fr' ? 'livraison possible' : 'delivery available');
  }
  if (analysis.askedAccessible && item.accessible) {
    flags.push(lang === 'fr' ? 'accès facilité' : 'easy access');
  }
  return flags;
}

export function buildLocalConciergeReply(
  analysis: ConciergeQueryAnalysis,
  recommendations: ConciergeRecommendation[],
  lang: ConciergeLang,
  extras: { posts?: PostAnnonce[]; basket?: LocalBasket | null } = {},
): string {
  const book = PHRASEBOOK[lang];
  const fr = lang === 'fr';
  const spoken = recommendations.slice(0, CONCIERGE_SPOKEN_RESULTS);
  const heritage = analysis.askedHistory ? heritageForQuery(analysis)[0] : undefined;
  const heritageLine = heritage
    ? `${heritage.street}. ${lang === 'fr' ? heritage.trivia.fr : heritage.trivia.en}`
    : '';

  if (extras.basket) {
    const basket = extras.basket;
    const unmatched = basket.unmatched.length
      ? fr
        ? ` Il manque ${basket.unmatched.join(', ')} dans le quartier.`
        : ` Missing locally: ${basket.unmatched.join(', ')}.`
      : '';
    const lead = fr
      ? `${basket.summary} Total estimé ${Math.round(basket.totalEstimate)} euros.${unmatched}`
      : `${basket.summary} Estimated total ${Math.round(basket.totalEstimate)} euros.${unmatched}`;
    const bullets = basket.stops
      .slice(0, CONCIERGE_SPOKEN_RESULTS)
      .map((stop) => `- ${stop.name}, ${stop.address}.`);
    return formatAudioReadyReply([lead, ...bullets].join('\n'));
  }

  if (analysis.askedPosts && extras.posts && extras.posts.length > 0) {
    const lead = fr
      ? 'Voici les annonces du quartier qui collent vraiment à votre demande.'
      : 'Here are the neighborhood posts that actually match your request.';
    const bullets = extras.posts.slice(0, CONCIERGE_SPOKEN_RESULTS).map((post) => {
      const price = post.prix != null ? `${post.prix} euros` : fr ? 'gratuit' : 'free';
      return `- ${post.titre}, ${price}.`;
    });
    return formatAudioReadyReply([lead, ...bullets].join('\n'));
  }

  if (spoken.length > 0) {
    const top = spoken[0];
    const flags = spokenPlaceFlags(top, analysis, lang);
    const lead = flags.length
      ? fr
        ? `Avec plaisir. Je vous oriente d’abord vers ${top.name}, ${flags.join(', ')}.`
        : `Gladly. I would start with ${top.name}, ${flags.join(', ')}.`
      : book.intro;
    const bullets = spoken.map((item) => `- ${item.name}, ${item.address}.`);
    return formatAudioReadyReply([lead, ...bullets, heritageLine].filter(Boolean).join('\n'));
  }

  if (heritageLine) return formatAudioReadyReply(heritageLine);
  return formatAudioReadyReply(book.noMatch);
}

export function conciergePhrasebookLang(lang: string): ConciergeLang {
  const short = lang.slice(0, 2).toLowerCase();
  return isConciergeLang(short) ? short : 'fr';
}
