#!/usr/bin/env npx tsx
/**
 * Extrait les entités du quartier des Chartrons via l’API Overpass (OpenStreetMap)
 * et les fusionne dans `shared/src/data/osmChartronsPois.ts`.
 *
 * Les fiches curées de `CHARTRONS_POIS` et les acteurs de démo du seed
 * ne sont ni écrasées ni dupliquées.
 *
 * Usage : npm run fetch:pois
 *         npx tsx scripts/fetchChartronsPois.ts [--from /path/to/overpass.json]
 */
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { classifySubcategory, type ChartronsSubcategory } from '../shared/src/data/taxonomy.ts';
import { classifyBusinessType } from '../shared/src/logic/poi.ts';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const OUT_FILE = join(ROOT, 'shared/src/data/osmChartronsPois.ts');

/** Même emprise que `CHARTRONS_BOUNDING_BOX` : Notre-Dame, Portal, quais et rues adjacentes. */
export const BBOX = { south: 44.848, west: -0.578, north: 44.862, east: -0.565 };

const OVERPASS_ENDPOINTS = [
  'https://overpass-api.de/api/interpreter',
  'https://overpass.kumi.systems/api/interpreter',
  'https://overpass.osm.ch/api/interpreter',
];

type PoiCategory =
  | 'bouche_restauration'
  | 'mode_deco_antiquites'
  | 'sante_bien_etre'
  | 'patrimoine_culture'
  | 'services_artisanat';

interface OsmPoi {
  id: string;
  name: string;
  category: PoiCategory;
  subcategory: ChartronsSubcategory;
  specialty: string;
  address: string;
  coordinates: { lat: number; lng: number };
  description: string;
  isMerchant: boolean;
  hasBooking?: boolean;
  bookingUrl?: string;
  phone?: string;
  email?: string;
  website?: string;
  websiteUrl?: string;
  socialLinks?: { instagram?: string; facebook?: string; whatsapp?: string };
  businessType?: 'restaurant' | 'service_rdv' | 'commerce_collect' | 'institution';
  tier?: 'free' | 'premium_pro';
  openingHours?: string;
  _richness?: number;
  _norm?: string;
}

interface OverpassElement {
  type: string;
  id: number;
  lat?: number;
  lon?: number;
  center?: { lat: number; lon?: number; lng?: number };
  tags?: Record<string, string>;
}

const SKIP_OFFICES = new Set(['diplomatic', 'government', 'political_party', 'religion']);
const SKIP_AMENITIES = new Set(['vending_machine', 'parking', 'toilets', 'bench', 'waste_basket']);

const SHOP_LABELS: Record<string, string> = {
  alcohol: 'Caviste',
  antiques: 'Antiquaire',
  art: 'Galerie / Art',
  bakery: 'Boulangerie',
  beauty: 'Institut de beauté',
  beverages: 'Boissons',
  bicycle: 'Réparateur de vélos',
  books: 'Librairie',
  boutique: 'Boutique',
  butcher: 'Boucherie',
  cheese: 'Fromagerie',
  chemist: 'Parapharmacie',
  chocolate: 'Chocolatier',
  clothes: 'Prêt-à-porter',
  coffee: 'Café / Torréfaction',
  computer: 'Informatique',
  confectionery: 'Confiserie',
  convenience: 'Épicerie',
  copyshop: 'Reprographie',
  cosmetics: 'Cosmétiques',
  craft: 'Artisanat',
  deli: 'Traiteur',
  dry_cleaning: 'Pressing',
  florist: 'Fleuriste',
  furniture: 'Mobilier',
  greengrocer: 'Primeur',
  hairdresser: 'Coiffeur',
  houseware: 'Arts de la table',
  interior_decoration: 'Décoration',
  jewelry: 'Bijouterie',
  laundry: 'Laverie',
  massage: 'Massage',
  newsagent: 'Maison de la presse',
  optician: 'Opticien',
  organic: 'Producteur local',
  pastry: 'Pâtisserie',
  second_hand: 'Vintage / Seconde main',
  shoes: 'Chaussures',
  sports: 'Sport',
  supermarket: 'Supermarché',
  tailor: 'Tailleur',
  tea: 'Salon de thé',
  tobacco: 'Tabac',
  wholesale: 'Grossiste',
  wine: 'Caviste',
  farm: 'Producteur local',
};

const AMENITY_LABELS: Record<string, string> = {
  restaurant: 'Restaurant',
  cafe: 'Café',
  fast_food: 'Restauration rapide',
  bar: 'Bar',
  pub: 'Pub',
  ice_cream: 'Glacier',
  pharmacy: 'Pharmacie',
  doctors: 'Médecin',
  dentist: 'Dentiste',
  clinic: 'Clinique',
  veterinary: 'Vétérinaire',
  bank: 'Banque',
  atm: 'Distributeur automatique (DAB)',
  post_office: 'La Poste',
  laundry: 'Laverie',
  theatre: 'Théâtre',
  arts_centre: 'Espace culturel',
  cinema: 'Cinéma',
  community_centre: 'Maison de quartier',
  social_facility: 'Association',
  school: 'École',
  kindergarten: 'Crèche',
  childcare: 'Halte-garderie',
  college: 'École',
  library: 'Espace culturel',
  marketplace: 'Producteur local',
};

const OFFICE_LABELS: Record<string, string> = {
  architect: 'Architecte',
  association: 'Association',
  company: 'Bureau / Entreprise',
  consulting: 'Conseil',
  coworking: 'Coworking',
  educational_institution: 'Formation',
  employment_agency: 'Agence d’emploi',
  estate_agent: 'Agence immobilière',
  financial: 'Services financiers',
  insurance: 'Assurance',
  it: 'Informatique / Digital',
  lawyer: 'Avocat',
  ngo: 'Association',
  notary: 'Notaire',
  tax_advisor: 'Expert-comptable',
  therapist: 'Thérapeute',
};

const HEALTHCARE_LABELS: Record<string, string> = {
  doctor: 'Médecin',
  dentist: 'Dentiste',
  clinic: 'Clinique',
  pharmacy: 'Pharmacie',
  physiotherapist: 'Kinésithérapeute',
  psychotherapist: 'Psychologue',
  alternative: 'Médecine douce',
  laboratory: 'Laboratoire',
  midwife: 'Sage-femme',
  nurse: 'Infirmier',
};

const CRAFT_LABELS: Record<string, string> = {
  bakery: 'Boulangerie',
  carpenter: 'Menuisier',
  electrician: 'Électricien',
  plumber: 'Plombier',
  shoemaker: 'Cordonnier',
  tailor: 'Tailleur',
  photographer: 'Photographe',
  brewery: 'Brasserie',
  winery: 'Vigneron',
  jeweller: 'Bijoutier',
  upholsterer: 'Tapissier',
  locksmith: 'Serrurier',
};

const TOURISM_LABELS: Record<string, string> = {
  hotel: 'Hôtel',
  guest_house: 'Maison d’hôtes',
  museum: 'Musée',
  gallery: 'Galerie',
  attraction: 'Patrimoine & culture',
};

const LEISURE_LABELS: Record<string, string> = {
  sports_centre: 'Club sportif',
  fitness_centre: 'Salle de sport',
  fitness_studio: 'Salle de sport',
  sports_hall: 'Club sportif',
  swimming_pool: 'Centre de loisirs',
  dance: 'Centre de loisirs',
};

const CUISINE_LABELS: Record<string, string> = {
  french: 'française',
  italian: 'italienne',
  pizza: 'pizza',
  japanese: 'japonaise',
  sushi: 'sushi',
  burger: 'burgers',
  seafood: 'fruits de mer',
  regional: 'régionale',
  wine: 'vins',
  crepe: 'crêpes',
  vegetarian: 'végétarienne',
  vegan: 'végane',
};

function overpassQuery(): string {
  const { south, west, north, east } = BBOX;
  const bbox = `${south},${west},${north},${east}`;
  return `[out:json][timeout:90];
(
  nwr["shop"](${bbox});
  nwr["amenity"~"^(restaurant|cafe|fast_food|bar|pub|biergarten|ice_cream|food_court|pharmacy|doctors|dentist|clinic|hospital|veterinary|bank|atm|post_office|laundry|theatre|arts_centre|cinema|community_centre|social_facility|school|kindergarten|childcare|college|library|marketplace)$"](${bbox});
  nwr["office"](${bbox});
  nwr["healthcare"](${bbox});
  nwr["craft"](${bbox});
  nwr["tourism"~"^(hotel|guest_house|museum|gallery|attraction)$"](${bbox});
  nwr["leisure"~"^(sports_centre|fitness_centre|fitness_studio|swimming_pool|sports_hall|dance)$"](${bbox});
  nwr["club"](${bbox});
);
out center tags;`;
}

async function fetchOverpass(): Promise<{ elements: OverpassElement[] }> {
  const body = new URLSearchParams({ data: overpassQuery() });
  let lastError: unknown = null;
  for (const url of OVERPASS_ENDPOINTS) {
    try {
      const res = await fetch(url, {
        method: 'POST',
        headers: {
          'User-Agent': 'idea-chartrons/1.0 (neighborhood PWA; OSM fetch)',
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body,
      });
      if (!res.ok) throw new Error(`${url} HTTP ${res.status}`);
      const json = (await res.json()) as { elements?: OverpassElement[] };
      if (!Array.isArray(json.elements)) throw new Error(`${url} invalid payload`);
      return { elements: json.elements };
    } catch (err) {
      lastError = err;
    }
  }
  throw lastError ?? new Error('Overpass unavailable');
}

function stripAccents(value: string): string {
  return value.normalize('NFD').replace(/\p{M}/gu, '');
}

function normalizeName(value: string): string {
  return stripAccents(String(value || ''))
    .toLowerCase()
    .replace(/['’]/g, ' ')
    .replace(/[^a-z0-9]+/g, ' ')
    .replace(/\b(le|la|les|l|de|du|des|au|aux|et|the)\b/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function distanceMeters(a: { lat: number; lng: number }, b: { lat: number; lng: number }): number {
  const R = 6371000;
  const toRad = (deg: number) => (deg * Math.PI) / 180;
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(a.lat)) * Math.cos(toRad(b.lat)) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.atan2(Math.sqrt(h), Math.sqrt(1 - h));
}

function coordsOf(element: OverpassElement): { lat: number; lng: number } | null {
  if (typeof element.lat === 'number' && typeof element.lon === 'number') {
    return { lat: element.lat, lng: element.lon };
  }
  if (element.center && typeof element.center.lat === 'number') {
    return { lat: element.center.lat, lng: element.center.lng ?? element.center.lon ?? 0 };
  }
  return null;
}

function labelOf(map: Record<string, string>, key: string | undefined, fallback: string): string {
  if (!key || key === 'yes') return fallback;
  return map[key] || key.replace(/_/g, ' ');
}

function hasAtm(tags: Record<string, string>): boolean {
  return tags.amenity === 'atm' || tags.atm === 'yes' || tags.atm === 'separate';
}

function schoolSpecialty(tags: Record<string, string>): string {
  const privateSchool =
    tags['school:type'] === 'private' ||
    tags['operator:type'] === 'religious' ||
    tags['operator:type'] === 'private' ||
    tags.fee === 'yes';
  if (tags.amenity === 'kindergarten' || tags.amenity === 'childcare') {
    return tags.amenity === 'childcare' ? 'Halte-garderie' : 'Crèche';
  }
  return privateSchool ? 'École privée' : 'École publique';
}

function classify(tags: Record<string, string>): { category: PoiCategory; specialty: string } | null {
  const amenity = tags.amenity;
  const shop = tags.shop;
  const office = tags.office;
  const healthcare = tags.healthcare;
  const craft = tags.craft;
  const tourism = tags.tourism;
  const leisure = tags.leisure;
  const club = tags.club;

  if (SKIP_AMENITIES.has(amenity) || SKIP_OFFICES.has(office)) return null;

  if (amenity === 'atm') {
    return { category: 'services_artisanat', specialty: 'Distributeur automatique (DAB)' };
  }
  if (amenity === 'bank') {
    return { category: 'services_artisanat', specialty: hasAtm(tags) ? 'Banque (DAB)' : 'Banque' };
  }
  if (['school', 'college'].includes(amenity)) {
    return { category: 'services_artisanat', specialty: schoolSpecialty(tags) };
  }
  if (amenity === 'kindergarten' || amenity === 'childcare') {
    return { category: 'services_artisanat', specialty: schoolSpecialty(tags) };
  }
  if (['theatre', 'arts_centre', 'cinema', 'library'].includes(amenity)) {
    return { category: 'patrimoine_culture', specialty: labelOf(AMENITY_LABELS, amenity, 'Espace culturel') };
  }
  if (amenity === 'community_centre' || amenity === 'social_facility' || office === 'association' || office === 'ngo') {
    return { category: 'services_artisanat', specialty: 'Association' };
  }
  if (leisure || club) {
    return {
      category: 'services_artisanat',
      specialty: labelOf(LEISURE_LABELS, leisure, club ? 'Club sportif' : 'Centre de loisirs'),
    };
  }
  if (['restaurant', 'cafe', 'fast_food', 'ice_cream', 'food_court'].includes(amenity)) {
    return { category: 'bouche_restauration', specialty: labelOf(AMENITY_LABELS, amenity, 'Restaurant') };
  }
  if (['bar', 'pub', 'biergarten', 'nightclub'].includes(amenity)) {
    return { category: 'bouche_restauration', specialty: labelOf(AMENITY_LABELS, amenity, 'Bar') };
  }
  if (['pharmacy', 'doctors', 'dentist', 'clinic', 'hospital', 'veterinary'].includes(amenity) || healthcare) {
    return {
      category: 'sante_bien_etre',
      specialty:
        labelOf(AMENITY_LABELS, amenity, '') ||
        labelOf(HEALTHCARE_LABELS, healthcare, 'Santé & bien-être'),
    };
  }
  if (
    shop &&
    [
      'bakery', 'pastry', 'butcher', 'cheese', 'seafood', 'greengrocer', 'convenience',
      'supermarket', 'deli', 'wine', 'alcohol', 'chocolate', 'coffee', 'tea', 'beverages',
      'confectionery', 'organic', 'farm',
    ].includes(shop)
  ) {
    return { category: 'bouche_restauration', specialty: labelOf(SHOP_LABELS, shop, 'Alimentation') };
  }
  if (shop === 'wholesale') {
    return { category: 'services_artisanat', specialty: 'Grossiste' };
  }
  if (
    shop &&
    ['clothes', 'boutique', 'shoes', 'jewelry', 'antiques', 'furniture', 'interior_decoration', 'art', 'second_hand', 'fabric', 'houseware'].includes(shop)
  ) {
    return { category: 'mode_deco_antiquites', specialty: labelOf(SHOP_LABELS, shop, 'Mode & déco') };
  }
  if (
    shop &&
    ['chemist', 'optician', 'hearing_aids', 'massage', 'medical_supply', 'beauty', 'cosmetics', 'hairdresser', 'health_food'].includes(shop)
  ) {
    return { category: 'sante_bien_etre', specialty: labelOf(SHOP_LABELS, shop, 'Santé & bien-être') };
  }
  if (tourism && ['hotel', 'guest_house', 'museum', 'gallery', 'attraction'].includes(tourism)) {
    return { category: 'patrimoine_culture', specialty: labelOf(TOURISM_LABELS, tourism, 'Tourisme') };
  }
  if (office === 'coworking') {
    return { category: 'services_artisanat', specialty: 'Coworking' };
  }
  if (office) {
    return { category: 'services_artisanat', specialty: labelOf(OFFICE_LABELS, office, 'Bureau / service') };
  }
  if (craft) {
    const foodCraft = ['bakery', 'confectionery', 'winery', 'brewery'].includes(craft);
    return {
      category: foodCraft ? 'bouche_restauration' : 'services_artisanat',
      specialty: labelOf(CRAFT_LABELS, craft, 'Artisanat'),
    };
  }
  if (amenity === 'post_office' || amenity === 'laundry' || amenity === 'marketplace') {
    return { category: 'services_artisanat', specialty: labelOf(AMENITY_LABELS, amenity, 'Service') };
  }
  if (shop) {
    return { category: 'services_artisanat', specialty: labelOf(SHOP_LABELS, shop, 'Commerce') };
  }
  return null;
}

function formatPhone(raw: string | undefined): string | undefined {
  if (!raw) return undefined;
  const first = String(raw).split(';')[0].trim();
  const digits = first.replace(/[^\d+]/g, '');
  let national = digits;
  if (national.startsWith('+33')) national = `0${national.slice(3)}`;
  else if (national.startsWith('0033')) national = `0${national.slice(4)}`;
  const compact = national.replace(/\D/g, '');
  if (compact.length === 10 && compact.startsWith('0')) {
    return compact.replace(/(\d{2})(?=\d)/g, '$1 ').trim();
  }
  return first;
}

function formatAddress(tags: Record<string, string>): string {
  const number = tags['addr:housenumber'];
  const street = tags['addr:street'];
  const postcode = tags['addr:postcode'] || '33000';
  const city = tags['addr:city'] || 'Bordeaux';
  if (tags['addr:full']) return tags['addr:full'];
  if (number && street) return `${number} ${street}, ${postcode} ${city}`;
  if (street) return `${street}, ${postcode} ${city}`;
  return `Quartier des Chartrons, ${postcode} ${city}`;
}

function formatCuisine(raw: string | undefined): string {
  if (!raw) return '';
  const parts = String(raw)
    .split(/[;,]/)
    .map((part) => part.trim())
    .filter(Boolean)
    .slice(0, 3)
    .map((part) => CUISINE_LABELS[part] || part.replace(/_/g, ' '));
  return parts.length ? ` Spécialités : ${parts.join(', ')}.` : '';
}

function websiteOf(tags: Record<string, string>): string | undefined {
  const raw = tags.website || tags['contact:website'] || tags.url;
  if (!raw) return undefined;
  const value = String(raw).trim();
  if (!value) return undefined;
  if (/^https?:\/\//i.test(value)) return value;
  return `https://${value}`;
}

function richness(tags: Record<string, string>): number {
  return ['phone', 'contact:phone', 'website', 'contact:website', 'opening_hours', 'addr:street', 'cuisine'].filter(
    (key) => tags[key],
  ).length;
}

function fallbackName(tags: Record<string, string>, specialty: string): string | null {
  const operator = String(tags.operator || tags.brand || '').trim();
  const street = String(tags['addr:street'] || '').trim();
  if (tags.amenity === 'atm') {
    if (operator && street) return `DAB ${operator} — ${street}`;
    if (operator) return `DAB ${operator}`;
    if (street) return `Distributeur automatique — ${street}`;
    return 'Distributeur automatique (DAB)';
  }
  if (['school', 'kindergarten', 'childcare', 'college'].includes(tags.amenity)) {
    if (operator) return operator;
    if (street) return `${specialty} — ${street}`;
  }
  return null;
}

function civicHints(tags: Record<string, string>, specialty: string): string {
  const hints: string[] = [];
  if (hasAtm(tags) || specialty.includes('DAB')) hints.push('DAB', 'distributeur automatique', 'ATM');
  if (/école|creche|halte/i.test(specialty)) hints.push('petite enfance', 'éducation');
  if (/théâtre|cinéma|culturel/i.test(specialty)) hints.push('spectacle', 'culture');
  if (/association|club|loisirs|sport/i.test(specialty)) hints.push('association', 'loisirs');
  if (/grossiste|producteur|circuit/i.test(specialty)) hints.push('circuit court', 'B2B');
  if (/antiquaire|vintage|galerie/i.test(specialty)) hints.push('antiquités', 'artisanat');
  return hints.length ? ` Mots-clés : ${[...new Set(hints)].join(', ')}.` : '';
}

function toPoi(element: OverpassElement): OsmPoi | null {
  const tags = element.tags || {};
  const classified = classify(tags);
  if (!classified) return null;

  const name = String(tags.name || fallbackName(tags, classified.specialty) || '').trim();
  if (name.length < 2) return null;

  const coordinates = coordsOf(element);
  if (!coordinates) return null;
  if (
    coordinates.lat < BBOX.south ||
    coordinates.lat > BBOX.north ||
    coordinates.lng < BBOX.west ||
    coordinates.lng > BBOX.east
  ) {
    return null;
  }

  const phone = formatPhone(tags.phone || tags['contact:phone'] || tags['contact:mobile']);
  const email = String(tags.email || tags['contact:email'] || '').trim() || undefined;
  const website = websiteOf(tags);
  const bookingUrl =
    website && /doctolib|planity/i.test(website) ? website : tags.appointment || undefined;
  const civic = ['atm', 'school', 'kindergarten', 'childcare', 'theatre', 'community_centre'].includes(tags.amenity);
  const description = `${classified.specialty} du quartier des Chartrons.${formatCuisine(tags.cuisine)}${civicHints(tags, classified.specialty)} Fiche issue d’OpenStreetMap.`;
  const instagram = tags['contact:instagram'] || tags.instagram;
  const facebook = tags['contact:facebook'] || tags.facebook;
  const whatsapp = tags['contact:whatsapp'] || tags.whatsapp;

  const poi: OsmPoi = {
    id: `poi-osm-${element.type[0]}${element.id}`,
    name,
    category: classified.category,
    specialty: classified.specialty,
    subcategory: classifySubcategory(classified.specialty, classified.category),
    address: formatAddress(tags),
    coordinates: {
      lat: Math.round(coordinates.lat * 1e6) / 1e6,
      lng: Math.round(coordinates.lng * 1e6) / 1e6,
    },
    description,
    isMerchant: !civic && tags.amenity !== 'atm' && tags.office !== 'association',
    tier: 'free',
  };
  poi.businessType = classifyBusinessType(poi);
  if (phone) poi.phone = phone;
  if (email) poi.email = email;
  if (tags.opening_hours) poi.openingHours = tags.opening_hours;
  if (website) {
    poi.website = website;
    poi.websiteUrl = website;
  }
  if (instagram || facebook || whatsapp) {
    poi.socialLinks = {
      instagram: instagram ? (instagram.startsWith('http') ? instagram : `https://instagram.com/${instagram.replace(/^@/, '')}`) : undefined,
      facebook: facebook ? (facebook.startsWith('http') ? facebook : `https://facebook.com/${facebook}`) : undefined,
      whatsapp: whatsapp || undefined,
    };
  }
  if (bookingUrl) {
    poi.hasBooking = true;
    poi.bookingUrl = bookingUrl;
  }
  poi._richness = richness(tags);
  poi._norm = normalizeName(name);
  return poi;
}

function loadProtectedPlaces(): Array<{ name: string; lat: number; lng: number }> {
  const places: Array<{ name: string; lat: number; lng: number }> = [];

  const curated = readFileSync(join(ROOT, 'shared/src/data/chartronsPois.ts'), 'utf8');
  const curatedBody = curated.split('export function')[0] ?? curated;
  const curatedBlocks = curatedBody.split(/\n\s*\{\n/).slice(1);
  for (const block of curatedBlocks) {
    const name = block.match(/name:\s*'((?:\\'|[^'])*)'/)?.[1];
    const lat = Number(block.match(/lat:\s*([0-9.]+)/)?.[1]);
    const lng = Number(block.match(/lng:\s*(-?[0-9.]+)/)?.[1]);
    if (name && Number.isFinite(lat) && Number.isFinite(lng)) {
      places.push({ name: name.replace(/\\'/g, "'"), lat, lng });
    }
  }

  const seed = readFileSync(join(ROOT, 'shared/src/data/seed.ts'), 'utf8');
  const seedBlocks = seed.split(/\n\s*\{\n/).slice(1);
  for (const block of seedBlocks) {
    const name = block.match(/nomCommerce:\s*'((?:\\'|[^'])*)'/)?.[1];
    const lat = Number(block.match(/latitude:\s*([0-9.]+)/)?.[1]);
    const lng = Number(block.match(/longitude:\s*(-?[0-9.]+)/)?.[1]);
    if (name && Number.isFinite(lat) && Number.isFinite(lng)) {
      places.push({ name: name.replace(/\\'/g, "'"), lat, lng });
    }
  }

  return places;
}

function isDuplicateOfProtected(
  poi: OsmPoi,
  protectedPlaces: Array<{ name: string; lat: number; lng: number }>,
): boolean {
  return protectedPlaces.some((place) => {
    const sameName = poi._norm === normalizeName(place.name);
    const close = distanceMeters(poi.coordinates, place) < 60;
    return (sameName && close) || (sameName && (poi._norm?.length ?? 0) >= 8);
  });
}

function dedupeOsm(pois: OsmPoi[]): OsmPoi[] {
  const kept: OsmPoi[] = [];
  for (const poi of pois) {
    const twin = kept.find(
      (other) => other._norm === poi._norm && distanceMeters(other.coordinates, poi.coordinates) < 40,
    );
    if (!twin) {
      kept.push(poi);
      continue;
    }
    if ((poi._richness || 0) > (twin._richness || 0)) {
      kept.splice(kept.indexOf(twin), 1, poi);
    }
  }
  return kept;
}

function stripInternal(poi: OsmPoi): Omit<OsmPoi, '_richness' | '_norm'> {
  const { _richness: _r, _norm: _n, ...rest } = poi;
  return rest;
}

function renderTs(pois: Array<Omit<OsmPoi, '_richness' | '_norm'>>, meta: Record<string, unknown>): string {
  return `import type { ChartronsPoiInput } from '../types/poi.js';

/** Auto-generated from OpenStreetMap Overpass API. Re-run \`npm run fetch:pois\`. */
export const OSM_IMPORT_META = ${JSON.stringify(meta, null, 2)} as const;

export const OSM_CHARTRONS_POIS: ChartronsPoiInput[] = ${JSON.stringify(pois, null, 2)};
`;
}

function countBy(pois: Array<{ specialty: string; subcategory: ChartronsSubcategory }>, key: 'specialty' | 'subcategory') {
  const counts = new Map<string, number>();
  for (const poi of pois) {
    counts.set(poi[key], (counts.get(poi[key]) ?? 0) + 1);
  }
  return [...counts.entries()].sort((a, b) => b[1] - a[1]);
}

async function main() {
  const fromIdx = process.argv.indexOf('--from');
  let payload: { elements: OverpassElement[] };
  if (fromIdx >= 0 && process.argv[fromIdx + 1]) {
    payload = JSON.parse(readFileSync(process.argv[fromIdx + 1], 'utf8')) as { elements: OverpassElement[] };
  } else {
    payload = await fetchOverpass();
  }

  const protectedPlaces = loadProtectedPlaces();
  const mapped = (payload.elements || []).map(toPoi).filter((poi): poi is OsmPoi => Boolean(poi));
  const withoutProtected = mapped.filter((poi) => !isDuplicateOfProtected(poi, protectedPlaces));
  const unique = dedupeOsm(withoutProtected).sort((a, b) => a.name.localeCompare(b.name, 'fr'));
  const pois = unique.map(stripInternal);

  const meta = {
    source: 'OpenStreetMap Overpass API',
    license: 'ODbL',
    bbox: BBOX,
    fetchedAt: new Date().toISOString(),
    rawElements: (payload.elements || []).length,
    imported: pois.length,
    skippedCurated: mapped.length - withoutProtected.length,
  };

  mkdirSync(dirname(OUT_FILE), { recursive: true });
  writeFileSync(OUT_FILE, renderTs(pois, meta));

  console.log(`Wrote ${pois.length} OSM listings to ${OUT_FILE}`);
  console.log(`Protected curated/seed places: ${protectedPlaces.length}`);
  console.log(`Skipped duplicates of curated/seed: ${mapped.length - withoutProtected.length}`);
  console.log(`Deduped OSM twins: ${withoutProtected.length - unique.length}`);
  console.log('\nSous-catégories unifiées :');
  for (const [key, value] of countBy(pois, 'subcategory')) {
    console.log(`  ${String(value).padStart(4)}  ${key}`);
  }
  console.log('\nSpécialités ciblées (extrait) :');
  const focus = [
    'Distributeur automatique (DAB)',
    'Banque (DAB)',
    'Banque',
    'École publique',
    'École privée',
    'Crèche',
    'Halte-garderie',
    'Théâtre',
    'Espace culturel',
    'Association',
    'Club sportif',
    'Coworking',
    'Grossiste',
    'Producteur local',
    'Antiquaire',
    'Caviste',
  ];
  for (const specialty of focus) {
    const n = pois.filter((poi) => poi.specialty === specialty).length;
    if (n) console.log(`  ${String(n).padStart(4)}  ${specialty}`);
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
