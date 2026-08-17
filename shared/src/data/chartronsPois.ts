import { ActeurLocalCategory } from '../types/enums.js';
import type { ActeurLocal } from '../types/models.js';
import { createCafeMarcheMenu, DEFAULT_MERCHANT_PIN, defaultMerchantEmail, emptySocialLinks } from '../logic/commerce.js';
import { defaultRegleForCategory, generateQrVitrineCode } from '../logic/fidelite.js';

export type ChartronsPoiCategory =
  | 'bouche_restauration'
  | 'mode_deco_antiquites'
  | 'sante_bien_etre'
  | 'patrimoine_culture'
  | 'services_artisanat';

export interface ChartronsPoi {
  id: string;
  name: string;
  category: ChartronsPoiCategory;
  subcategory: string;
  address: string;
  coordinates: { lat: number; lng: number };
  description: string;
  isMerchant: boolean;
  hasMenu?: boolean;
  hasBooking?: boolean;
  bookingUrl?: string;
  phone?: string;
  imageUrl?: string;
  rating?: number;
  reviewsCount?: number;
  openingHours?: string;
}

export const CHARTRONS_BOUNDING_BOX = {
  sw: { lat: 44.848, lng: -0.578 },
  ne: { lat: 44.862, lng: -0.565 },
} as const;

export const CHARTRONS_POIS: ChartronsPoi[] = [
  {
    id: 'poi-rest-001',
    name: 'Bistro des Chartrons',
    category: 'bouche_restauration',
    subcategory: 'Restaurant & Bistro',
    address: '73 Rue Notre-Dame, 33000 Bordeaux',
    coordinates: { lat: 44.8525, lng: -0.571 },
    description: 'Cuisine traditionnelle de saison et produits locaux au cœur de la Rue Notre-Dame.',
    isMerchant: true,
    hasMenu: true,
    phone: '05 56 00 11 22',
    rating: 4.6,
    reviewsCount: 142,
    openingHours: 'Lun - Sam : 12:00 - 14:30, 19:00 - 22:30',
    imageUrl: 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=800&q=80',
  },
  {
    id: 'poi-rest-002',
    name: 'Boulangerie L’Amour du Pain',
    category: 'bouche_restauration',
    subcategory: 'Boulangerie',
    address: '42 Cours Portal, 33000 Bordeaux',
    coordinates: { lat: 44.854, lng: -0.5735 },
    description: 'Pains au levain naturel, viennoiseries artisanales et pâtisseries fines.',
    isMerchant: true,
    rating: 4.8,
    reviewsCount: 310,
    openingHours: 'Mar - Dim : 07:00 - 19:30',
    imageUrl: 'https://images.unsplash.com/photo-1509440159596-0249088772ff?auto=format&fit=crop&w=800&q=80',
  },
  {
    id: 'poi-rest-003',
    name: 'La Cave des Chartrons',
    category: 'bouche_restauration',
    subcategory: 'Caviste',
    address: '18 Rue Notre-Dame, 33000 Bordeaux',
    coordinates: { lat: 44.8505, lng: -0.5722 },
    description: 'Sélection rigoureuse de vins de Bordeaux, vins bio et spiritueux.',
    isMerchant: true,
    phone: '05 56 44 33 22',
    rating: 4.9,
    reviewsCount: 85,
    openingHours: 'Mar - Sam : 10:00 - 20:00',
    imageUrl: 'https://images.unsplash.com/photo-1510812431401-41d2bd2722f3?auto=format&fit=crop&w=800&q=80',
  },
  {
    id: 'poi-rest-004',
    name: 'Café de la Halle',
    category: 'bouche_restauration',
    subcategory: 'Café & Salon de thé',
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
    subcategory: 'Antiquaire',
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
    subcategory: 'Maison & Décoration',
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
    subcategory: 'Pharmacie',
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
    subcategory: 'Coiffeur & Barbier',
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
    subcategory: 'Patrimoine & Culture',
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
    subcategory: 'Lieu de culte',
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
    subcategory: 'Musée',
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
    subcategory: 'Réparateur de vélos',
    address: '12 Cours de la Martinique, 33000 Bordeaux',
    coordinates: { lat: 44.8552, lng: -0.572 },
    description: 'Réparation rapide, entretien et vente de vélos urbains et électriques.',
    isMerchant: true,
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
    subcategory: 'Pressing & Laverie',
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

function categoryToActeur(category: ChartronsPoiCategory, subcategory: string): ActeurLocalCategory {
  if (category === 'sante_bien_etre') return ActeurLocalCategory.SanteSoinsServices;
  if (category === 'patrimoine_culture') return ActeurLocalCategory.TourismeConciergerie;
  if (category === 'bouche_restauration') {
    const sub = subcategory.toLowerCase();
    if (sub.includes('boulangerie') || sub.includes('caviste')) {
      return ActeurLocalCategory.CommercesArtisanat;
    }
    return ActeurLocalCategory.RestaurationMenus;
  }
  return ActeurLocalCategory.CommercesArtisanat;
}

function ownerForPoi(poi: ChartronsPoi): string {
  if (poi.id.startsWith('poi-sante-001') || poi.id.startsWith('poi-serv')) return 'user-1';
  return 'user-2';
}

export function chartronsPoiToActeur(poi: ChartronsPoi, now: string): ActeurLocal {
  const categorie = categoryToActeur(poi.category, poi.subcategory);
  const rule = defaultRegleForCategory(categorie);
  const ownerId = ownerForPoi(poi);
  return {
    id: `acteur-${poi.id}`,
    userId: ownerId,
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
    appointmentUrl: poi.hasBooking ? poi.bookingUrl ?? null : null,
    rating: poi.rating ?? null,
    reviewsCount: poi.reviewsCount ?? null,
    openingHours: poi.openingHours ?? null,
    specialite: poi.subcategory,
    pinCode: poi.isMerchant ? DEFAULT_MERCHANT_PIN : null,
    merchantEmail: poi.isMerchant ? defaultMerchantEmail(ownerId) : null,
    socialLinks: emptySocialLinks(),
    isMerchant: poi.isMerchant,
    createdAt: now,
    updatedAt: now,
  };
}

export function createChartronsPoiActeurs(now: string): ActeurLocal[] {
  return CHARTRONS_POIS.map((poi) => chartronsPoiToActeur(poi, now));
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
    subtitle: poi.subcategory,
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
