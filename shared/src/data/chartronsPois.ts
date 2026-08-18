import { ActeurLocalCategory, ArdoiseStatus } from '../types/enums.js';
import type { ActeurLocal } from '../types/models.js';
import type { ChartronsPoi, ChartronsPoiInput } from '../types/poi.js';
import {
  createCafeMarcheMenu,
  DEFAULT_MERCHANT_PIN,
  emptySocialLinks,
  sanitizeExternalUrl,
} from '../logic/commerce.js';
import { hydrateChartronsPoi, poiPublicWebsite } from '../logic/poi.js';
import { defaultRegleForCategory, generateQrVitrineCode } from '../logic/fidelite.js';
import { OSM_CHARTRONS_POIS } from './osmChartronsPois.js';

export const CHARTRONS_BOUNDING_BOX = {
  sw: { lat: 44.848, lng: -0.578 },
  ne: { lat: 44.862, lng: -0.565 },
} as const;

export const CHARTRONS_POIS: ChartronsPoiInput[] = [
  {
    id: 'poi-rest-001',
    name: 'Bistro des Chartrons',
    category: 'bouche_restauration',
    subcategory: 'restauration_cafes',
    specialty: 'Restaurant & Bistro',
    address: '73 Rue Notre-Dame, 33000 Bordeaux',
    coordinates: { lat: 44.8525, lng: -0.571 },
    description: 'Cuisine traditionnelle de saison et produits locaux au cœur de la Rue Notre-Dame.',
    isMerchant: true,
    businessType: 'restaurant',
    tier: 'premium_pro',
    hasMenu: true,
    phone: '05 56 00 11 22',
    email: 'contact@bistrodeschartrons.fr',
    socialLinks: { instagram: 'https://www.instagram.com/bistrodeschartrons/' },
    websiteUrl: 'https://www.bistrodeschartrons.fr/',
    qualifications: ['Maître Restaurateur'],
    catalog: {
      items: [
        { name: 'Plat du jour', price: 18, ingredients: ['viande', 'salade'] },
        { name: 'Canelés maison', price: 3, ingredients: ['canele', 'vanille'] },
      ],
      menus: ['Carte'],
    },
    rating: 4.6,
    reviewsCount: 142,
    openingHours: 'Lun - Sam : 12:00 - 14:30, 19:00 - 22:30',
    hasDelivery: true,
    wheelchairAccessible: true,
    seniorFriendly: true,
    accessible: true,
    imageUrl: 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=800&q=80',
  },
  {
    id: 'poi-rest-002',
    name: 'Boulangerie L’Amour du Pain',
    category: 'bouche_restauration',
    subcategory: 'metiers_de_bouche',
    specialty: 'Boulangerie',
    address: '42 Cours Portal, 33000 Bordeaux',
    coordinates: { lat: 44.854, lng: -0.5735 },
    description: 'Pains au levain naturel, viennoiseries artisanales et pâtisseries fines.',
    isMerchant: true,
    phone: '05 56 81 20 14',
    email: 'bonjour@amourdupain.fr',
    socialLinks: { instagram: 'https://www.instagram.com/amourdupain.chartrons/' },
    qualifications: ['Maître artisan boulanger'],
    catalog: {
      items: [
        { name: 'Baguette tradition', price: 1.2, ingredients: ['pain', 'farine'] },
        { name: 'Farine T55 1 kg', price: 2.4, ingredients: ['farine'] },
        { name: 'Beurre doux 250 g', price: 3.2, ingredients: ['beurre'] },
        { name: 'Canelés', price: 2.5, ingredients: ['canele', 'sucre'] },
      ],
    },
    rating: 4.8,
    reviewsCount: 310,
    openingHours: 'Mar - Dim : 07:00 - 19:30',
    imageUrl: 'https://images.unsplash.com/photo-1509440159596-0249088772ff?auto=format&fit=crop&w=800&q=80',
  },
  {
    id: 'poi-rest-003',
    name: 'La Cave des Chartrons',
    category: 'bouche_restauration',
    subcategory: 'metiers_de_bouche',
    specialty: 'Caviste',
    address: '18 Rue Notre-Dame, 33000 Bordeaux',
    coordinates: { lat: 44.8505, lng: -0.5722 },
    description: 'Sélection rigoureuse de vins de Bordeaux, vins bio et spiritueux.',
    isMerchant: true,
    phone: '05 56 44 33 22',
    email: 'cave@chartrons.vin',
    socialLinks: { instagram: 'https://www.instagram.com/lacavedeschartrons/' },
    qualifications: ['Sommelier certifié'],
    catalog: {
      items: [
        { name: 'Bordeaux rouge', price: 12, ingredients: ['vin', 'wine'] },
        { name: 'Rhum agricole 20 cl', price: 8.5, ingredients: ['rhum', 'rum'] },
      ],
    },
    rating: 4.9,
    reviewsCount: 85,
    openingHours: 'Mar - Sam : 10:00 - 20:00',
    imageUrl: 'https://images.unsplash.com/photo-1510812431401-41d2bd2722f3?auto=format&fit=crop&w=800&q=80',
  },
  {
    id: 'poi-rest-004',
    name: 'Café de la Halle',
    category: 'bouche_restauration',
    subcategory: 'restauration_cafes',
    specialty: 'Café & Salon de thé',
    address: 'Place du Marché des Chartrons, 33000 Bordeaux',
    coordinates: { lat: 44.8532, lng: -0.5718 },
    description: 'Terrasse iconique sous la Halle des Chartrons pour une pause café ou un apéritif.',
    isMerchant: true,
    hasMenu: true,
    rating: 4.4,
    reviewsCount: 220,
    openingHours: 'Lun - Dim : 08:00 - 23:00',
    imageUrl: 'https://images.unsplash.com/photo-1554118811-1e0d58224f24?auto=format&fit=crop&w=800&q=80',
  },
  {
    id: 'poi-deco-001',
    name: 'Antiquités Village Chartrons',
    category: 'mode_deco_antiquites',
    subcategory: 'boutiques',
    specialty: 'Antiquaire',
    address: '61 Rue Notre-Dame, 33000 Bordeaux',
    coordinates: { lat: 44.852, lng: -0.5712 },
    description: 'Mobilier ancien, objets d’art et curiosités du XVIIIe et XIXe siècle.',
    isMerchant: true,
    rating: 4.7,
    reviewsCount: 64,
    openingHours: 'Mar - Sam : 10:00 - 19:00',
    imageUrl: 'https://images.unsplash.com/photo-1513519245088-0e12902e5a38?auto=format&fit=crop&w=800&q=80',
  },
  {
    id: 'poi-deco-002',
    name: 'Concept Store Chartronnais',
    category: 'mode_deco_antiquites',
    subcategory: 'boutiques',
    specialty: 'Maison & Décoration',
    address: '88 Rue Notre-Dame, 33000 Bordeaux',
    coordinates: { lat: 44.8535, lng: -0.5705 },
    description: 'Objets de décoration éco-responsables, vêtements créateurs et accessoires.',
    isMerchant: true,
    rating: 4.5,
    reviewsCount: 42,
    openingHours: 'Mar - Sam : 10:30 - 19:00',
    imageUrl: 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?auto=format&fit=crop&w=800&q=80',
  },
  {
    id: 'poi-sante-001',
    name: 'Pharmacie des Chartrons',
    category: 'sante_bien_etre',
    subcategory: 'services_proximite',
    specialty: 'Pharmacie',
    address: '55 Cours Portal, 33000 Bordeaux',
    coordinates: { lat: 44.8548, lng: -0.573 },
    description: 'Pharmacie de quartier, parapharmacie, orthopédie et conseils santé.',
    isMerchant: true,
    phone: '05 56 52 11 00',
    rating: 4.3,
    reviewsCount: 58,
    openingHours: 'Lun - Sam : 08:30 - 19:30',
    imageUrl: 'https://images.unsplash.com/photo-1586015555751-63bb77f4322a?auto=format&fit=crop&w=800&q=80',
  },
  {
    id: 'poi-sante-002',
    name: 'Salon Coiffure Notre-Dame',
    category: 'sante_bien_etre',
    subcategory: 'services_proximite',
    specialty: 'Coiffeur & Barbier',
    address: '34 Rue Notre-Dame, 33000 Bordeaux',
    coordinates: { lat: 44.8512, lng: -0.5719 },
    description: 'Coupes hommes/femmes, soins capillaires naturels et taille de barbe.',
    isMerchant: true,
    hasBooking: true,
    bookingUrl: 'https://www.planity.com/',
    rating: 4.8,
    reviewsCount: 115,
    openingHours: 'Mar - Sam : 09:00 - 19:00',
    imageUrl: 'https://images.unsplash.com/photo-1560066984-138dadb4c035?auto=format&fit=crop&w=800&q=80',
  },
  {
    id: 'poi-cult-001',
    name: 'Halle des Chartrons',
    category: 'patrimoine_culture',
    subcategory: 'patrimoine_tourisme',
    specialty: 'Patrimoine & Culture',
    address: 'Place du Marché des Chartrons, 33000 Bordeaux',
    coordinates: { lat: 44.8532, lng: -0.5718 },
    description: 'Ancien marché couvert octogonal du XIXe siècle, espace d’expositions et événements.',
    isMerchant: false,
    rating: 4.6,
    reviewsCount: 530,
    openingHours: 'Accès libre selon programmation événementielle',
    imageUrl: 'https://images.unsplash.com/photo-1513694203232-719a280e022f?auto=format&fit=crop&w=800&q=80',
  },
  {
    id: 'poi-cult-002',
    name: 'Église Saint-Louis des Chartrons',
    category: 'patrimoine_culture',
    subcategory: 'patrimoine_tourisme',
    specialty: 'Lieu de culte',
    address: '51 Rue Notre-Dame, 33000 Bordeaux',
    coordinates: { lat: 44.8518, lng: -0.5714 },
    description: 'Église néo-gothique remarquable, célèbre pour son grand orgue historique.',
    isMerchant: false,
    rating: 4.7,
    reviewsCount: 310,
    openingHours: 'Tous les jours : 09:00 - 18:00',
    imageUrl: 'https://images.unsplash.com/photo-1548625361-1811e59543e3?auto=format&fit=crop&w=800&q=80',
  },
  {
    id: 'poi-cult-003',
    name: 'Musée du Vin et du Négoce',
    category: 'patrimoine_culture',
    subcategory: 'patrimoine_tourisme',
    specialty: 'Musée',
    address: '41 Rue Borie, 33000 Bordeaux',
    coordinates: { lat: 44.8542, lng: -0.5695 },
    description: 'Découverte de l’histoire des négociants en vin bordelais et dégustations.',
    isMerchant: true,
    hasBooking: true,
    bookingUrl: 'https://www.mvnb.fr/',
    rating: 4.5,
    reviewsCount: 480,
    openingHours: 'Tous les jours : 10:00 - 18:00',
    imageUrl: 'https://images.unsplash.com/photo-1510812431401-41d2bd2722f3?auto=format&fit=crop&w=800&q=80',
  },
  {
    id: 'poi-serv-001',
    name: 'Atelier Vélo des Chartrons',
    category: 'services_artisanat',
    subcategory: 'artisans',
    specialty: 'Réparateur de vélos',
    address: '12 Cours de la Martinique, 33000 Bordeaux',
    coordinates: { lat: 44.8552, lng: -0.572 },
    description: 'Réparation rapide, entretien et vente de vélos urbains et électriques.',
    isMerchant: true,
    businessType: 'service_rdv',
    qualifications: ['Réparateur cycles', 'Maître artisan'],
    phone: '05 56 81 99 88',
    rating: 4.8,
    reviewsCount: 92,
    openingHours: 'Mar - Sam : 09:00 - 18:30',
    imageUrl: 'https://images.unsplash.com/photo-1485965120184-e220f721d03e?auto=format&fit=crop&w=800&q=80',
  },
  {
    id: 'poi-serv-002',
    name: 'Pressing Écologique du Cours',
    category: 'services_artisanat',
    subcategory: 'services_proximite',
    specialty: 'Pressing & Laverie',
    address: '28 Cours Portal, 33000 Bordeaux',
    coordinates: { lat: 44.853, lng: -0.574 },
    description: 'Nettoyage à sec écologique sans solvant toxique et retouches de vêtements.',
    isMerchant: true,
    rating: 4.4,
    reviewsCount: 35,
    openingHours: 'Lun - Ven : 08:00 - 19:00',
    imageUrl: 'https://images.unsplash.com/photo-1517677208171-0bc6725a3e60?auto=format&fit=crop&w=800&q=80',
  },
];

const NIGHTLIFE_SPECIALTIES = ['bar', 'pub', 'night', 'guinguette', 'boite'];

const OFFICE_SPECIALTIES = [
  'banque', 'assurance', 'avocat', 'notaire', 'architecte', 'agence', 'bureau', 'coworking',
  'reprographie', 'formation', 'informatique', 'poste', 'financiers', 'developer', 'advertising',
  'publisher', 'union', 'emploi', 'voyages',
];

const CARE_SPECIALTIES = [
  'pharmacie', 'medecin', 'laboratoire', 'opticien', 'medecine', 'sante', 'beaute', 'coiffeur',
  'barbier', 'veterinaire', 'rehabilitation', 'personal', 'grooming',
];

function specialtyMatches(specialty: string, keywords: string[]): boolean {
  const normalized = specialty
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');
  return keywords.some((keyword) => normalized.includes(keyword));
}

/** Traduit la taxonomie unifiée vers les catégories de l'annuaire. */
function categoryToActeur(poi: ChartronsPoi): ActeurLocalCategory {
  if (specialtyMatches(poi.specialty, NIGHTLIFE_SPECIALTIES)) {
    return ActeurLocalCategory.BarsNightlife;
  }
  switch (poi.subcategory) {
    case 'patrimoine_tourisme':
      return ActeurLocalCategory.TourismeConciergerie;
    case 'restauration_cafes':
      return ActeurLocalCategory.RestaurationMenus;
    case 'metiers_de_bouche':
    case 'artisans':
    case 'boutiques':
      return ActeurLocalCategory.CommercesArtisanat;
    case 'services_proximite':
      if (specialtyMatches(poi.specialty, CARE_SPECIALTIES)) {
        return ActeurLocalCategory.SanteSoinsServices;
      }
      if (specialtyMatches(poi.specialty, OFFICE_SPECIALTIES)) {
        return ActeurLocalCategory.StartupsB2B;
      }
      return ActeurLocalCategory.CommercesArtisanat;
    default:
      return ActeurLocalCategory.CommercesArtisanat;
  }
}

export function chartronsPoiToActeur(poi: ChartronsPoi, now: string): ActeurLocal {
  const categorie = categoryToActeur(poi);
  const rule = defaultRegleForCategory(categorie);
  const premium = poi.tier === 'premium_pro';
  const website = premium ? sanitizeExternalUrl(poiPublicWebsite(poi)) : null;
  return {
    id: `acteur-${poi.id}`,
    nomCommerce: poi.name,
    categorie,
    description: poi.description,
    adresse: poi.address,
    telephone: poi.phone ?? null,
    latitude: poi.coordinates.lat,
    longitude: poi.coordinates.lng,
    photos: poi.imageUrl ? [poi.imageUrl] : [],
    offreVip: null,
    pointsRequisVip: 0,
    qrCodeVitrine: poi.isMerchant ? generateQrVitrineCode(poi.name) : null,
    regleFideliteMode: rule.mode,
    regleFideliteValeur: rule.valeur,
    menu: poi.hasMenu ? createCafeMarcheMenu() : null,
    appointmentUrl: premium && poi.hasBooking ? poi.bookingUrl ?? null : null,
    rating: poi.reputation.score ?? poi.rating ?? null,
    reviewsCount: poi.reputation.reviews ?? poi.reviewsCount ?? null,
    openingHours: poi.openingHours ?? null,
    specialite: poi.specialty,
    subcategory: poi.subcategory,
    pinCode: poi.isMerchant ? DEFAULT_MERCHANT_PIN : null,
    merchantEmail: poi.email ?? null,
    socialLinks: {
      ...emptySocialLinks(),
      instagram: poi.socialLinks?.instagram ?? null,
      facebook: poi.socialLinks?.facebook ?? null,
      whatsapp: poi.socialLinks?.whatsapp ?? null,
      website,
    },
    isMerchant: poi.isMerchant,
    isVip: premium,
    businessType: poi.businessType,
    tier: poi.tier,
    qualifications: poi.qualifications,
    reputation: poi.reputation,
    catalog: poi.catalog,
    phoneForOrders: premium ? poi.phone ?? null : null,
    hasDelivery: Boolean(poi.hasDelivery),
    wheelchairAccessible: Boolean(poi.wheelchairAccessible),
    seniorFriendly: Boolean(poi.seniorFriendly),
    dailyMenuText: poi.id === 'poi-rest-001' ? 'Plat du jour : magret de canard, jus au poivre' : null,
    dailyMenuImage:
      poi.id === 'poi-rest-001'
        ? 'https://images.unsplash.com/photo-1414235077428-338989a2e8c0?auto=format&fit=crop&w=800&q=80'
        : null,
    dailyMenuStatus: poi.id === 'poi-rest-001' ? ArdoiseStatus.Approved : ArdoiseStatus.Pending,
    dailyMenuSubmittedAt: poi.id === 'poi-rest-001' ? now : null,
    createdAt: now,
    updatedAt: now,
  };
}

/** Fusion runtime : fiches curées d’abord, puis import OSM (`npm run fetch:pois`). */
export function allChartronsPois(): ChartronsPoi[] {
  return [...CHARTRONS_POIS, ...OSM_CHARTRONS_POIS].map(hydrateChartronsPoi);
}

export function createChartronsPoiActeurs(now: string): ActeurLocal[] {
  return allChartronsPois().map((poi) => chartronsPoiToActeur(poi, now));
}

export function culturePlacePois(): Array<{
  id: string;
  title: string;
  subtitle: string;
  adresse: string;
  latitude: number;
  longitude: number;
  telephone: string | null;
  imageUrl?: string;
  rating?: number;
  reviewsCount?: number;
  openingHours?: string;
  kind: 'tourisme' | 'marche';
}> {
  return CHARTRONS_POIS.filter((poi) => !poi.isMerchant).map((poi) => ({
    id: poi.id,
    title: poi.name,
    subtitle: poi.specialty,
    adresse: poi.address,
    latitude: poi.coordinates.lat,
    longitude: poi.coordinates.lng,
    telephone: poi.phone ?? null,
    imageUrl: poi.imageUrl,
    rating: poi.rating,
    reviewsCount: poi.reviewsCount,
    openingHours: poi.openingHours,
    kind: poi.id === 'poi-cult-001' ? 'marche' : 'tourisme',
  }));
}
