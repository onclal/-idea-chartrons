#!/usr/bin/env node
/**
 * Fetches named shops, restaurants, services and health professionals
 * in the Chartrons bounding box from the OpenStreetMap Overpass API,
 * then writes shared/src/data/osmChartronsPois.ts
 *
 * Usage: node scripts/import-osm-chartrons.mjs [--from /path/to/overpass.json]
 */
import { writeFileSync, readFileSync, mkdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');
const OUT_FILE = join(ROOT, 'shared/src/data/osmChartronsPois.ts');

export const BBOX = { south: 44.848, west: -0.578, north: 44.862, east: -0.565 };

const OVERPASS_ENDPOINTS = [
  'https://overpass-api.de/api/interpreter',
  'https://overpass.kumi.systems/api/interpreter',
];

const EXISTING_PLACES = [
  { name: 'Brocante des Chartrons', lat: 44.85405, lng: -0.56915 },
  { name: 'Café du Marché', lat: 44.85145, lng: -0.57125 },
  { name: 'Atelier Céramique Chartrons', lat: 44.85055, lng: -0.57215 },
  { name: 'Cabinet Infirmier des Chartrons', lat: 44.85335, lng: -0.57245 },
  { name: 'Clinique Vétérinaire Portal', lat: 44.85375, lng: -0.57355 },
  { name: 'Conciergerie des Chartrons', lat: 44.85115, lng: -0.57085 },
  { name: 'Consigne Chartrons', lat: 44.85295, lng: -0.57155 },
  { name: 'Le Comptoir Portal', lat: 44.85315, lng: -0.57325 },
  { name: 'Atelier Numérique Chartrons', lat: 44.85085, lng: -0.56895 },
  { name: 'Atelier Coiffure des Chartrons', lat: 44.85125, lng: -0.57155 },
  { name: 'Bistro des Chartrons', lat: 44.8525, lng: -0.571 },
  { name: 'Boulangerie L’Amour du Pain', lat: 44.854, lng: -0.5735 },
  { name: 'La Cave des Chartrons', lat: 44.8505, lng: -0.5722 },
  { name: 'Café de la Halle', lat: 44.8532, lng: -0.5718 },
  { name: 'Antiquités Village Chartrons', lat: 44.852, lng: -0.5712 },
  { name: 'Concept Store Chartronnais', lat: 44.8535, lng: -0.5705 },
  { name: 'Pharmacie des Chartrons', lat: 44.8548, lng: -0.573 },
  { name: 'Salon Coiffure Notre-Dame', lat: 44.8512, lng: -0.5719 },
  { name: 'Halle des Chartrons', lat: 44.8532, lng: -0.5718 },
  { name: 'Église Saint-Louis des Chartrons', lat: 44.8518, lng: -0.5714 },
  { name: 'Musée du Vin et du Négoce', lat: 44.8542, lng: -0.5695 },
  { name: 'Atelier Vélo des Chartrons', lat: 44.8552, lng: -0.572 },
  { name: 'Pressing Écologique du Cours', lat: 44.853, lng: -0.574 },
];

const SKIP_OFFICES = new Set(['diplomatic', 'government', 'ngo', 'association', 'political_party', 'religion']);
const SKIP_AMENITIES = new Set(['atm', 'vending_machine', 'parking', 'toilets', 'bench']);

const SHOP_LABELS = {
  alcohol: 'Caviste',
  antiques: 'Antiquaire',
  art: 'Galerie / Art',
  bakery: 'Boulangerie',
  beauty: 'Institut de beauté',
  beverages: 'Boissons',
  bicycle: 'Vélo',
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
  department_store: 'Grand magasin',
  doityourself: 'Bricolage',
  dry_cleaning: 'Pressing',
  electronics: 'Électronique',
  fabric: 'Tissus',
  florist: 'Fleuriste',
  frame: 'Encadrement',
  furniture: 'Mobilier',
  garden_centre: 'Jardinerie',
  greengrocer: 'Primeur',
  hairdresser: 'Coiffeur',
  hardware: 'Quincaillerie',
  health_food: 'Diététique',
  hearing_aids: 'Audioprothésiste',
  hifi: 'Hi-fi',
  houseware: 'Arts de la table',
  interior_decoration: 'Décoration',
  jewelry: 'Bijouterie',
  kiosk: 'Kiosque',
  laundry: 'Laverie',
  massage: 'Massage',
  medical_supply: 'Matériel médical',
  mobile_phone: 'Téléphonie',
  newsagent: 'Maison de la presse',
  optician: 'Opticien',
  organic: 'Bio',
  outdoor: 'Plein air',
  pastry: 'Pâtisserie',
  perfume: 'Parfumerie',
  pet: 'Animalerie',
  second_hand: 'Seconde main',
  shoes: 'Chaussures',
  sports: 'Sport',
  stationery: 'Papeterie',
  supermarket: 'Supermarché',
  tailor: 'Tailleur',
  tea: 'Salon de thé',
  tobacco: 'Tabac',
  toys: 'Jouets',
  travel_agency: 'Agence de voyages',
  variety_store: 'Bazar',
  wine: 'Caviste',
};

const AMENITY_LABELS = {
  restaurant: 'Restaurant',
  cafe: 'Café',
  fast_food: 'Restauration rapide',
  bar: 'Bar',
  pub: 'Pub',
  biergarten: 'Guinguette',
  ice_cream: 'Glacier',
  food_court: 'Food court',
  pharmacy: 'Pharmacie',
  doctors: 'Médecin',
  dentist: 'Dentiste',
  clinic: 'Clinique',
  hospital: 'Établissement de santé',
  veterinary: 'Vétérinaire',
  bank: 'Banque',
  post_office: 'La Poste',
  laundry: 'Laverie',
  nightclub: 'Boîte de nuit',
};

const OFFICE_LABELS = {
  architect: 'Architecte',
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
  newspaper: 'Presse',
  notary: 'Notaire',
  tax_advisor: 'Expert-comptable',
  telecommunication: 'Télécoms',
  therapist: 'Thérapeute',
};

const HEALTHCARE_LABELS = {
  doctor: 'Médecin',
  dentist: 'Dentiste',
  clinic: 'Clinique',
  pharmacy: 'Pharmacie',
  physiotherapist: 'Kinésithérapeute',
  psychotherapist: 'Psychologue',
  alternative: 'Médecine douce',
  optometrist: 'Opticien',
  podiatrist: 'Pédicure-podologue',
  laboratory: 'Laboratoire',
  midwife: 'Sage-femme',
  nurse: 'Infirmier',
  audiologist: 'Audioprothésiste',
};

const CRAFT_LABELS = {
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
  painter: 'Peintre',
  locksmith: 'Serrurier',
};

const TOURISM_LABELS = {
  hotel: 'Hôtel',
  guest_house: 'Maison d’hôtes',
  museum: 'Musée',
  gallery: 'Galerie',
};

const CUISINE_LABELS = {
  french: 'française',
  italian: 'italienne',
  pizza: 'pizza',
  japanese: 'japonaise',
  sushi: 'sushi',
  chinese: 'chinoise',
  indian: 'indienne',
  thai: 'thaïlandaise',
  vietnamese: 'vietnamienne',
  burger: 'burgers',
  seafood: 'fruits de mer',
  fish_and_chips: 'fish and chips',
  regional: 'régionale',
  wine: 'vins',
  coffee_shop: 'café',
  ice_cream: 'glaces',
  crepe: 'crêpes',
  bakery: 'boulangerie',
  sandwich: 'sandwichs',
  kebab: 'kebab',
  mexican: 'mexicaine',
  tapas: 'tapas',
  vegetarian: 'végétarienne',
  vegan: 'végane',
  asian: 'asiatique',
  lebanese: 'libanaise',
  greek: 'grecque',
  portuguese: 'portugaise',
  spanish: 'espagnole',
  african: 'africaine',
  barbecue: 'grillades',
  steak_house: 'viandes',
  pasta: 'pâtes',
  ramen: 'ramen',
  poke: 'poke',
  brunch: 'brunch',
};

function overpassQuery() {
  const { south, west, north, east } = BBOX;
  const bbox = `${south},${west},${north},${east}`;
  return `[out:json][timeout:90];
(
  nwr["shop"](${bbox});
  nwr["amenity"~"^(restaurant|cafe|fast_food|bar|pub|biergarten|ice_cream|food_court|pharmacy|doctors|dentist|clinic|hospital|veterinary|bank|post_office|laundry)$"](${bbox});
  nwr["office"](${bbox});
  nwr["healthcare"](${bbox});
  nwr["craft"](${bbox});
  nwr["tourism"~"^(hotel|guest_house|museum|gallery)$"](${bbox});
);
out center tags;`;
}

async function fetchOverpass() {
  const body = new URLSearchParams({ data: overpassQuery() });
  let lastError = null;
  for (const url of OVERPASS_ENDPOINTS) {
    try {
      const res = await fetch(url, {
        method: 'POST',
        headers: {
          'User-Agent': 'idea-chartrons/1.0 (neighborhood PWA; OSM import)',
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body,
      });
      if (!res.ok) throw new Error(`${url} HTTP ${res.status}`);
      const json = await res.json();
      if (!Array.isArray(json.elements)) throw new Error(`${url} invalid payload`);
      return json;
    } catch (err) {
      lastError = err;
    }
  }
  throw lastError ?? new Error('Overpass unavailable');
}

function stripAccents(value) {
  return value.normalize('NFD').replace(/\p{M}/gu, '');
}

function normalizeName(value) {
  return stripAccents(String(value || ''))
    .toLowerCase()
    .replace(/['’]/g, ' ')
    .replace(/[^a-z0-9]+/g, ' ')
    .replace(/\b(le|la|les|l|de|du|des|au|aux|et|the)\b/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function distanceMeters(a, b) {
  const R = 6371000;
  const toRad = (deg) => (deg * Math.PI) / 180;
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const lat1 = toRad(a.lat);
  const lat2 = toRad(b.lat);
  const h =
    Math.sin(dLat / 2) ** 2 + Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.atan2(Math.sqrt(h), Math.sqrt(1 - h));
}

function coordsOf(element) {
  if (typeof element.lat === 'number' && typeof element.lon === 'number') {
    return { lat: element.lat, lng: element.lon };
  }
  if (element.center && typeof element.center.lat === 'number') {
    return { lat: element.center.lat, lng: element.center.lng ?? element.center.lon };
  }
  return null;
}

function labelOf(map, key, fallback) {
  if (!key || key === 'yes') return fallback;
  return map[key] || key.replace(/_/g, ' ');
}

function classify(tags) {
  const amenity = tags.amenity;
  const shop = tags.shop;
  const office = tags.office;
  const healthcare = tags.healthcare;
  const craft = tags.craft;
  const tourism = tags.tourism;

  if (SKIP_AMENITIES.has(amenity) || SKIP_OFFICES.has(office)) return null;

  if (['restaurant', 'cafe', 'fast_food', 'ice_cream', 'food_court'].includes(amenity)) {
    return { category: 'bouche_restauration', subcategory: labelOf(AMENITY_LABELS, amenity, 'Restaurant') };
  }
  if (['bar', 'pub', 'biergarten', 'nightclub'].includes(amenity)) {
    return { category: 'bouche_restauration', subcategory: labelOf(AMENITY_LABELS, amenity, 'Bar') };
  }
  if (['pharmacy', 'doctors', 'dentist', 'clinic', 'hospital', 'veterinary'].includes(amenity) || healthcare) {
    return {
      category: 'sante_bien_etre',
      subcategory:
        labelOf(AMENITY_LABELS, amenity, null) ||
        labelOf(HEALTHCARE_LABELS, healthcare, 'Santé & bien-être'),
    };
  }
  if (shop && ['bakery', 'pastry', 'butcher', 'cheese', 'seafood', 'greengrocer', 'convenience', 'supermarket', 'deli', 'wine', 'alcohol', 'chocolate', 'coffee', 'tea', 'beverages', 'confectionery'].includes(shop)) {
    return { category: 'bouche_restauration', subcategory: labelOf(SHOP_LABELS, shop, 'Alimentation') };
  }
  if (shop && ['clothes', 'boutique', 'shoes', 'jewelry', 'antiques', 'furniture', 'interior_decoration', 'art', 'second_hand', 'fabric', 'houseware'].includes(shop)) {
    return { category: 'mode_deco_antiquites', subcategory: labelOf(SHOP_LABELS, shop, 'Mode & déco') };
  }
  if (shop && ['chemist', 'optician', 'hearing_aids', 'massage', 'medical_supply', 'beauty', 'cosmetics', 'hairdresser', 'health_food'].includes(shop)) {
    return { category: 'sante_bien_etre', subcategory: labelOf(SHOP_LABELS, shop, 'Santé & bien-être') };
  }
  if (tourism && ['hotel', 'guest_house', 'museum', 'gallery'].includes(tourism)) {
    return { category: 'patrimoine_culture', subcategory: labelOf(TOURISM_LABELS, tourism, 'Tourisme') };
  }
  if (office) {
    return { category: 'services_artisanat', subcategory: labelOf(OFFICE_LABELS, office, 'Bureau / service') };
  }
  if (craft) {
    const foodCraft = ['bakery', 'confectionery', 'winery', 'brewery'].includes(craft);
    return {
      category: foodCraft ? 'bouche_restauration' : 'services_artisanat',
      subcategory: labelOf(CRAFT_LABELS, craft, 'Artisanat'),
    };
  }
  if (amenity === 'bank' || amenity === 'post_office' || amenity === 'laundry') {
    return { category: 'services_artisanat', subcategory: labelOf(AMENITY_LABELS, amenity, 'Service') };
  }
  if (shop) {
    return { category: 'services_artisanat', subcategory: labelOf(SHOP_LABELS, shop, 'Commerce') };
  }
  return null;
}

function formatPhone(raw) {
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

function formatAddress(tags) {
  const number = tags['addr:housenumber'];
  const street = tags['addr:street'];
  const postcode = tags['addr:postcode'] || '33000';
  const city = tags['addr:city'] || 'Bordeaux';
  if (tags['addr:full']) return tags['addr:full'];
  if (number && street) return `${number} ${street}, ${postcode} ${city}`;
  if (street) return `${street}, ${postcode} ${city}`;
  return `Quartier des Chartrons, ${postcode} ${city}`;
}

function formatCuisine(raw) {
  if (!raw) return '';
  const parts = String(raw)
    .split(/[;,]/)
    .map((part) => part.trim())
    .filter(Boolean)
    .slice(0, 3)
    .map((part) => CUISINE_LABELS[part] || part.replace(/_/g, ' '));
  return parts.length ? ` Spécialités : ${parts.join(', ')}.` : '';
}

function websiteOf(tags) {
  const raw = tags.website || tags['contact:website'] || tags.url;
  if (!raw) return undefined;
  const value = String(raw).trim();
  if (!value) return undefined;
  if (/^https?:\/\//i.test(value)) return value;
  return `https://${value}`;
}

function richness(tags) {
  return ['phone', 'contact:phone', 'website', 'contact:website', 'opening_hours', 'addr:street', 'cuisine'].filter(
    (key) => tags[key],
  ).length;
}

function toPoi(element) {
  const tags = element.tags || {};
  const name = String(tags.name || '').trim();
  if (name.length < 2) return null;
  const classified = classify(tags);
  if (!classified) return null;
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
  const website = websiteOf(tags);
  const bookingUrl =
    website && /doctolib|planity/i.test(website) ? website : tags.appointment || undefined;
  const description = `${classified.subcategory} du quartier des Chartrons.${formatCuisine(tags.cuisine)} Fiche issue d’OpenStreetMap.`;

  const poi = {
    id: `poi-osm-${element.type[0]}${element.id}`,
    name,
    category: classified.category,
    subcategory: classified.subcategory,
    address: formatAddress(tags),
    coordinates: {
      lat: Math.round(coordinates.lat * 1e6) / 1e6,
      lng: Math.round(coordinates.lng * 1e6) / 1e6,
    },
    description,
    isMerchant: true,
  };
  if (phone) poi.phone = phone;
  if (tags.opening_hours) poi.openingHours = tags.opening_hours;
  if (website) poi.website = website;
  if (bookingUrl) {
    poi.hasBooking = true;
    poi.bookingUrl = bookingUrl;
  }
  poi._richness = richness(tags);
  poi._norm = normalizeName(name);
  return poi;
}

function isDuplicateOfExisting(poi) {
  return EXISTING_PLACES.some((place) => {
    const sameName = poi._norm === normalizeName(place.name);
    const close = distanceMeters(poi.coordinates, place) < 60;
    return (sameName && close) || (sameName && poi._norm.length >= 8);
  });
}

function dedupeOsm(pois) {
  const kept = [];
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

function stripInternal(poi) {
  const { _richness, _norm, ...rest } = poi;
  return rest;
}

function renderTs(pois, meta) {
  return `import type { ChartronsPoi } from './chartronsPois.js';

/** Auto-generated from OpenStreetMap Overpass API. Re-run \`node scripts/import-osm-chartrons.mjs\`. */
export const OSM_IMPORT_META = ${JSON.stringify(meta, null, 2)} as const;

export const OSM_CHARTRONS_POIS: ChartronsPoi[] = ${JSON.stringify(pois, null, 2)};
`;
}

async function main() {
  const fromIdx = process.argv.indexOf('--from');
  let payload;
  if (fromIdx >= 0 && process.argv[fromIdx + 1]) {
    payload = JSON.parse(readFileSync(process.argv[fromIdx + 1], 'utf8'));
  } else {
    payload = await fetchOverpass();
  }

  const mapped = (payload.elements || []).map(toPoi).filter(Boolean);
  const withoutVipDupes = mapped.filter((poi) => !isDuplicateOfExisting(poi));
  const unique = dedupeOsm(withoutVipDupes).sort((a, b) => a.name.localeCompare(b.name, 'fr'));
  const pois = unique.map(stripInternal);

  const meta = {
    source: 'OpenStreetMap Overpass API',
    license: 'ODbL',
    bbox: BBOX,
    fetchedAt: new Date().toISOString(),
    rawElements: (payload.elements || []).length,
    imported: pois.length,
  };

  mkdirSync(dirname(OUT_FILE), { recursive: true });
  writeFileSync(OUT_FILE, renderTs(pois, meta));
  console.log(`Wrote ${pois.length} OSM listings to ${OUT_FILE}`);
  console.log(`Skipped duplicates of demo/VIP: ${mapped.length - withoutVipDupes.length}`);
  console.log(`Deduped OSM twins: ${withoutVipDupes.length - unique.length}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
