import {
  countSlotBookings,
  createDefaultRelaisSettings,
  expandPlagesToHourSlots,
  getCreneauCapacite,
  normalizeRelaisCreneauType,
  normalizeRelaisSettings,
} from '../logic/relais.js';
import {
  createCafeMarcheMenu,
  createDefaultPlatformSettings,
  DEFAULT_MERCHANT_PIN,
  defaultMerchantEmail,
  emptySocialLinks,
  normalizeSocialLinks,
} from '../logic/commerce.js';
import { createChartronsPoiActeurs } from './chartronsPois.js';

/** Bump when seed acteurs / Chartrons POIs change so localStorage upserts the catalog. */
export const SEED_CATALOG_VERSION = 6;
import { defaultRegleForCategory } from '../logic/fidelite.js';
import {
  ActeurLocalCategory,
  ArdoiseStatus,
  CivicReportChannel,
  CivicReportStatus,
  EventType,
  FideliteRegleMode,
  LocalRelaisRetraitStatus,
  PostStatus,
  PostType,
  RelaisCreneauType,
} from '../types/enums.js';
import type {
  ActeurLocal,
  AgendaEvenement,
  DatabaseSchema,
  LocalRelais,
  RelaisCreneau,
  RelaisSettings,
} from '../types/models.js';

/**
 * Carnet de démonstration rattaché à l'appareil (jamais à une personne).
 * Le navigateur reprend cet identifiant à la première visite, puis peut le régénérer.
 */
export const DEMO_DEVICE_ID = 'carnet-demo';

function localYmd(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function generateRelaisCreneaux(
  from = new Date(),
  days = 7,
  settings?: RelaisSettings | null,
): RelaisCreneau[] {
  const config = normalizeRelaisSettings(settings);
  const creneaux: RelaisCreneau[] = [];
  const slots = expandPlagesToHourSlots(config.plages);

  for (let day = 0; day < days; day += 1) {
    const date = new Date(from);
    date.setDate(from.getDate() + day);
    if (!config.openingDays.includes(date.getDay())) continue;
    const dateStr = localYmd(date);

    for (const slot of slots) {
      for (const type of [RelaisCreneauType.Depot, RelaisCreneauType.Retrait]) {
        creneaux.push({
          id: `creneau-${dateStr}-${slot.heureDebut}-${type}`,
          date: dateStr,
          heureDebut: slot.heureDebut,
          heureFin: slot.heureFin,
          type,
          capacite: config.defaultCapacite,
          reserves: 0,
          blocked: false,
        });
      }
    }
  }

  return creneaux;
}

export function syncRelaisCreneauxWindow(
  existing: RelaisCreneau[],
  relaisList: LocalRelais[],
  from = new Date(),
  settings?: RelaisSettings | null,
): RelaisCreneau[] {
  const config = normalizeRelaisSettings(settings);
  const generated = generateRelaisCreneaux(from, 7, config);
  const previous = new Map((existing ?? []).map((slot) => [slot.id, slot]));
  const referenced = new Set<string>();
  for (const relais of relaisList ?? []) {
    if (relais.creneauDepotId) referenced.add(relais.creneauDepotId);
    if (relais.creneauRetraitId) referenced.add(relais.creneauRetraitId);
  }

  const merged = new Map<string, RelaisCreneau>();
  for (const slot of generated) {
    const prev = previous.get(slot.id);
    merged.set(slot.id, {
      ...slot,
      type: normalizeRelaisCreneauType(prev?.type ?? slot.type),
      capacite: config.defaultCapacite,
      blocked: Boolean(prev?.blocked),
      reserves: 0,
    });
  }

  for (const id of referenced) {
    if (merged.has(id)) continue;
    const prev = previous.get(id);
    if (!prev) continue;
    merged.set(id, {
      ...prev,
      type: normalizeRelaisCreneauType(prev.type),
      capacite: getCreneauCapacite(prev),
      blocked: Boolean(prev.blocked),
      reserves: 0,
    });
  }

  return [...merged.values()].map((slot) => {
    const capacite = getCreneauCapacite(slot);
    return {
      ...slot,
      capacite,
      blocked: Boolean(slot.blocked),
      reserves: Math.min(capacite, countSlotBookings(relaisList ?? [], slot.id)),
    };
  });
}

export const MARCHE_CHARTRONS = {
  titre: 'Marché des Chartrons',
  description:
    'Marché hebdomadaire hyper-local : producteurs, fromages, fleurs et spécialités du quartier. Tous les dimanches, 8h–13h, Place du Marché des Chartrons sur les quais.',
  lieu: 'Place du Marché des Chartrons, quais des Chartrons, 33000 Bordeaux',
  latitude: 44.85235,
  longitude: -0.56985,
  image: 'https://images.unsplash.com/photo-1488459716781-31db52582fe9?w=400&h=300&fit=crop',
} as const;

function nextMarcheStart(from: Date): Date {
  const candidate = new Date(from);
  const day = candidate.getDay();
  const add = day === 0 ? 0 : 7 - day;
  candidate.setDate(candidate.getDate() + add);
  candidate.setHours(8, 0, 0, 0);
  const end = new Date(candidate);
  end.setHours(13, 0, 0, 0);
  if (end.getTime() <= from.getTime()) {
    candidate.setDate(candidate.getDate() + 7);
  }
  return candidate;
}

export function createUpcomingMarcheChartronsEvents(
  organisateurNom: string,
  nowIso: string,
  weeks = 8,
): AgendaEvenement[] {
  const now = new Date(nowIso);
  const events: AgendaEvenement[] = [];
  const start = nextMarcheStart(now);

  for (let index = 0; index < weeks; index += 1) {
    const dateDebut = new Date(start);
    dateDebut.setDate(start.getDate() + index * 7);
    dateDebut.setHours(8, 0, 0, 0);
    const dateFin = new Date(dateDebut);
    dateFin.setHours(13, 0, 0, 0);
    const ymd = localYmd(dateDebut);

    events.push({
      id: `event-marche-chartrons-${ymd}`,
      organisateurNom,
      titre: MARCHE_CHARTRONS.titre,
      description: MARCHE_CHARTRONS.description,
      dateDebut: dateDebut.toISOString(),
      dateFin: dateFin.toISOString(),
      image: MARCHE_CHARTRONS.image,
      type: EventType.Marche,
      lieu: MARCHE_CHARTRONS.lieu,
      latitude: MARCHE_CHARTRONS.latitude,
      longitude: MARCHE_CHARTRONS.longitude,
      createdAt: nowIso,
      updatedAt: nowIso,
    });
  }

  return events;
}

export function createSeedData(): DatabaseSchema {
  const now = new Date().toISOString();
  const today = localYmd(new Date());
  const tomorrowDate = new Date();
  tomorrowDate.setDate(tomorrowDate.getDate() + 1);
  const tomorrow = localYmd(tomorrowDate);

  const seed = {
    postsAnnonces: [
      {
        id: 'post-1',
        auteurNom: 'Marie',
        titre: 'Vélo enfant 14 pouces',
        description: 'Vélo en bon état, idéal pour enfant de 4-6 ans. Quelques traces d\'usage normales.',
        type: PostType.Vente,
        prix: 25,
        statut: PostStatus.DepotLocal,
        photos: ['https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400&h=300&fit=crop'],
        telephone: '06 12 34 56 01',
        createdAt: now,
        updatedAt: now,
      },
      {
        id: 'post-2',
        auteurNom: 'Sophie',
        titre: 'Livres de cuisine à donner',
        description: 'Collection de 15 livres de cuisine française. État impeccable.',
        type: PostType.Don,
        prix: null,
        statut: PostStatus.Disponible,
        photos: ['https://images.unsplash.com/photo-1497633768975-a6630d299a24?w=400&h=300&fit=crop'],
        telephone: '06 12 34 56 02',
        createdAt: now,
        updatedAt: now,
      },
      {
        id: 'post-3',
        auteurNom: 'Marie',
        titre: 'Aide bricolage léger',
        description: 'Disponible le week-end pour petits travaux : montage meubles, accrochage tableaux.',
        type: PostType.ServiceAide,
        prix: null,
        statut: PostStatus.Disponible,
        photos: ['https://images.unsplash.com/photo-1581578731548-c64695cc6952?w=400&h=300&fit=crop'],
        telephone: '06 12 34 56 03',
        createdAt: now,
        updatedAt: now,
      },
      {
        id: 'post-4',
        auteurNom: 'Thomas',
        titre: 'Arrosage plantes — vacances',
        description: 'Petit boulot : arroser les plantes pendant 2 semaines en août.',
        type: PostType.PetitBoulot,
        prix: 30,
        statut: PostStatus.DepotLocal,
        photos: ['https://images.unsplash.com/photo-1416879595882-3373a0480b5b?w=400&h=300&fit=crop'],
        telephone: '06 12 34 56 04',
        createdAt: now,
        updatedAt: now,
      },
      {
        id: 'post-5',
        auteurNom: 'Brocante des Chartrons',
        titre: 'Grande Vente Vintage de Printemps - Brocante des Chartrons',
        description:
          'Venez découvrir nos nouveaux arrivages d’antiquités et de meubles vintage ce week-end. Réduction spéciale pour les voisins !',
        type: PostType.Vente,
        prix: 10,
        statut: PostStatus.Disponible,
        photos: ['https://images.unsplash.com/photo-1513519245088-0e12902e35a6?w=800&h=500&fit=crop'],
        telephone: '05 56 48 12 01',
        createdAt: new Date(Date.now() + 60_000).toISOString(),
        updatedAt: now,
      },
    ],
    relaisSettings: [createDefaultRelaisSettings()],
    platformSettings: [createDefaultPlatformSettings()],
    relaisCreneaux: generateRelaisCreneaux(),
    localRelais: [
      {
        id: 'relais-1',
        postId: 'post-1',
        deposantNom: 'Marie',
        codeQrValidation: 'QR-CHARTRONS-001',
        dateDepot: now,
        statutRetrait: LocalRelaisRetraitStatus.EnAttente,
        creneauDepotId: `creneau-${today}-10:00-Depot`,
        creneauRetraitId: null,
        createdAt: now,
        updatedAt: now,
      },
      {
        id: 'relais-2',
        postId: 'post-4',
        deposantNom: 'Thomas',
        codeQrValidation: 'QR-CHARTRONS-002',
        dateDepot: now,
        statutRetrait: LocalRelaisRetraitStatus.DisponibleAuLocal,
        creneauDepotId: `creneau-${today}-14:00-Depot`,
        creneauRetraitId: `creneau-${tomorrow}-15:00-Retrait`,
        createdAt: now,
        updatedAt: now,
      },
    ],
    acteursLocaux: [
      {
        id: 'acteur-1',
        subcategory: 'boutiques' as const,
        specialiteFine: 'Antiquaire',
        nomCommerce: 'Brocante des Chartrons',
        categorie: ActeurLocalCategory.CommercesArtisanat,
        description: 'Brocante authentique au cœur du quartier. Meubles vintage, vaisselle et objets de charme.',
        adresse: '45 Cours Portal, 33000 Bordeaux',
        telephone: '05 56 48 12 01',
        photos: ['https://images.unsplash.com/photo-1555041469-a586c12ebb9a?w=400&h=300&fit=crop'],
        offreVip: '-10% sur votre prochain achat',
        pointsRequisVip: 100,
        qrCodeVitrine: 'QR-VITRINE-BROCANTE-001',
        latitude: 44.85405,
        longitude: -0.57255,
        createdAt: now,
        updatedAt: now,
      },
      {
        id: 'acteur-2',
        subcategory: 'restauration_cafes' as const,
        specialiteFine: 'Café & Salon de thé',
        nomCommerce: 'Café du Marché',
        categorie: ActeurLocalCategory.RestaurationMenus,
        description: 'Bistrot de quartier avec terrasse ombragée. Menu du jour, pâtisseries maison et produits locaux.',
        adresse: '22 Rue Notre-Dame, 33000 Bordeaux',
        telephone: '05 56 48 12 02',
        photos: ['https://images.unsplash.com/photo-1501339847302-ac826a8a8145?w=400&h=300&fit=crop'],
        offreVip: 'Café offert',
        pointsRequisVip: 50,
        qrCodeVitrine: 'QR-VITRINE-CAFE-002',
        latitude: 44.85145,
        longitude: -0.57025,
        createdAt: now,
        updatedAt: now,
      },
      {
        id: 'acteur-3',
        subcategory: 'artisans' as const,
        specialiteFine: 'Atelier de céramique',
        nomCommerce: 'Atelier Céramique Chartrons',
        categorie: ActeurLocalCategory.CommercesArtisanat,
        description: 'Céramique artisanale faite main. Ateliers découverte le samedi matin.',
        adresse: '5 Rue Josephine, 33000 Bordeaux',
        telephone: '05 56 48 12 03',
        photos: ['https://images.unsplash.com/photo-1578749556568-bc2c40a68b24?w=400&h=300&fit=crop'],
        offreVip: 'Atelier découverte -15%',
        pointsRequisVip: 80,
        qrCodeVitrine: 'QR-VITRINE-CERAMIQUE-003',
        latitude: 44.85055,
        longitude: -0.57185,
        createdAt: now,
        updatedAt: now,
      },
      {
        id: 'acteur-4',
        subcategory: 'services_proximite' as const,
        specialiteFine: 'Cabinet infirmier',
        nomCommerce: 'Cabinet Infirmier des Chartrons',
        categorie: ActeurLocalCategory.SanteSoinsServices,
        description: 'Soins infirmiers de proximité : pansements, suivi à domicile, vaccinations et petits soins du quotidien.',
        adresse: '18 Cours Portal, 33000 Bordeaux',
        telephone: '05 56 48 12 04',
        photos: ['https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?w=400&h=300&fit=crop'],
        offreVip: null,
        pointsRequisVip: 0,
        qrCodeVitrine: null,
        latitude: 44.85335,
        longitude: -0.57175,
        createdAt: now,
        updatedAt: now,
      },
      {
        id: 'acteur-5',
        subcategory: 'services_proximite' as const,
        specialiteFine: 'Vétérinaire',
        nomCommerce: 'Clinique Vétérinaire Portal',
        categorie: ActeurLocalCategory.SanteSoinsServices,
        description: 'Consultations, urgences et suivi des animaux de compagnie. Accueil sans rendez-vous le matin.',
        adresse: '31 Cours Portal, 33000 Bordeaux',
        telephone: '05 56 48 12 05',
        photos: ['https://images.unsplash.com/photo-1450778869180-41d0601e016d?w=400&h=300&fit=crop'],
        offreVip: 'Consultation de suivi -10%',
        pointsRequisVip: 60,
        qrCodeVitrine: 'QR-VITRINE-VETO-005',
        latitude: 44.85375,
        longitude: -0.57215,
        createdAt: now,
        updatedAt: now,
      },
      {
        id: 'acteur-6',
        subcategory: 'patrimoine_tourisme' as const,
        specialiteFine: 'Conciergerie',
        nomCommerce: 'Conciergerie des Chartrons',
        categorie: ActeurLocalCategory.TourismeConciergerie,
        description: 'Accueil des voyageurs, remise des clés, linge et conseils de quartier pour les locations saisonnières.',
        adresse: '8 Rue Notre-Dame, 33000 Bordeaux',
        telephone: '05 56 48 12 06',
        photos: ['https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=400&h=300&fit=crop'],
        offreVip: 'Guide des bonnes adresses offert',
        pointsRequisVip: 40,
        qrCodeVitrine: 'QR-VITRINE-CONCIERGE-006',
        latitude: 44.85115,
        longitude: -0.57035,
        createdAt: now,
        updatedAt: now,
      },
      {
        id: 'acteur-7',
        subcategory: 'patrimoine_tourisme' as const,
        specialiteFine: 'Consigne bagages',
        nomCommerce: 'Consigne Chartrons',
        categorie: ActeurLocalCategory.TourismeConciergerie,
        description: 'Consigne bagages pour visiteurs de passage. Idéal avant un train, un marché ou une visite des quais.',
        adresse: '12 Cours Portal, 33000 Bordeaux',
        telephone: '05 56 48 12 07',
        photos: ['https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?w=400&h=300&fit=crop'],
        offreVip: null,
        pointsRequisVip: 0,
        qrCodeVitrine: null,
        latitude: 44.85295,
        longitude: -0.57125,
        createdAt: now,
        updatedAt: now,
      },
      {
        id: 'acteur-8',
        subcategory: 'restauration_cafes' as const,
        specialiteFine: 'Bar',
        nomCommerce: 'Le Comptoir Portal',
        categorie: ActeurLocalCategory.BarsNightlife,
        description: 'Bar de quartier : happy hours, planches et soirées live. Terrasse jusqu’à tard le week-end.',
        adresse: '14 Cours Portal, 33000 Bordeaux',
        telephone: '05 56 48 12 08',
        photos: ['https://images.unsplash.com/photo-1514933651103-005eec06c04b?w=400&h=300&fit=crop'],
        offreVip: 'Happy hour prolongée',
        pointsRequisVip: 70,
        qrCodeVitrine: 'QR-VITRINE-COMPTOIR-008',
        latitude: 44.85315,
        longitude: -0.57195,
        createdAt: now,
        updatedAt: now,
      },
      {
        id: 'acteur-9',
        subcategory: 'services_proximite' as const,
        specialiteFine: 'Coworking',
        nomCommerce: 'Atelier Numérique Chartrons',
        categorie: ActeurLocalCategory.StartupsB2B,
        description: 'Coworking et services tertiaires pour indépendants et startups du quartier. Salles de réunion et factotum.',
        adresse: '9 Quai des Chartrons, 33000 Bordeaux',
        telephone: '05 56 48 12 09',
        photos: ['https://images.unsplash.com/photo-1497366216548-37526070297c?w=400&h=300&fit=crop'],
        offreVip: 'Demi-journée coworking offerte',
        pointsRequisVip: 90,
        qrCodeVitrine: 'QR-VITRINE-ATELIER-NUM-009',
        latitude: 44.85085,
        longitude: -0.56895,
        createdAt: now,
        updatedAt: now,
      },
      {
        id: 'acteur-10',
        subcategory: 'services_proximite' as const,
        specialiteFine: 'Coiffeur & Barbier',
        nomCommerce: 'Atelier Coiffure des Chartrons',
        categorie: ActeurLocalCategory.SanteSoinsServices,
        description: 'Salon de coiffure et soins : coupes, couleur, barbe. Accueil sur rendez-vous en semaine.',
        adresse: '7 Rue Notre-Dame, 33000 Bordeaux',
        telephone: '05 56 48 12 10',
        photos: ['https://images.unsplash.com/photo-1560066984-138dadb4c035?w=400&h=300&fit=crop'],
        offreVip: 'Shampoing offert',
        pointsRequisVip: 50,
        qrCodeVitrine: 'QR-VITRINE-COIFFURE-010',
        latitude: 44.85125,
        longitude: -0.57055,
        createdAt: now,
        updatedAt: now,
      },
    ],
    agendaEvenements: [
      ...createUpcomingMarcheChartronsEvents('Ville de Bordeaux', now),
      {
        id: 'event-1',
        organisateurNom: 'Brocante des Chartrons',
        titre: 'Grande Brocante du Dimanche',
        description: 'Brocante mensuelle sur le Cours Portal. Plus de 50 exposants.',
        dateDebut: '2026-08-17T08:00:00.000Z',
        dateFin: '2026-08-17T18:00:00.000Z',
        image: 'https://images.unsplash.com/photo-1598300042247-d088f8ab3a91?w=400&h=300&fit=crop',
        type: EventType.Brocante,
        lieu: 'Cours Portal, 33000 Bordeaux',
        latitude: 44.8539,
        longitude: -0.572,
        createdAt: now,
        updatedAt: now,
      },
      {
        id: 'event-2',
        organisateurNom: 'Comité de quartier',
        titre: 'Apéro des Voisins — Été',
        description: 'Rencontre conviviale sur la place du marché. Apéritif participatif.',
        dateDebut: '2026-08-22T17:00:00.000Z',
        dateFin: '2026-08-22T21:00:00.000Z',
        image: 'https://images.unsplash.com/photo-1530103862676-de8c9debad1d?w=400&h=300&fit=crop',
        type: EventType.AnimationAsso,
        lieu: 'Place du Marché des Chartrons, 33000 Bordeaux',
        latitude: 44.85235,
        longitude: -0.56985,
        createdAt: now,
        updatedAt: now,
      },
      {
        id: 'event-3',
        organisateurNom: 'Café du Marché',
        titre: 'Happy Hour -50%',
        description: 'Promo flash sur tous les cafés et pâtisseries entre 16h et 18h.',
        dateDebut: '2026-08-15T14:00:00.000Z',
        dateFin: '2026-08-15T18:00:00.000Z',
        image: 'https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=400&h=300&fit=crop',
        type: EventType.PromoFlash,
        lieu: 'Café du Marché, 22 Rue Notre-Dame, 33000 Bordeaux',
        latitude: 44.85145,
        longitude: -0.57025,
        createdAt: now,
        updatedAt: now,
      },
    ],
    cartesFideliteScans: [
      {
        id: 'scan-1',
        deviceId: DEMO_DEVICE_ID,
        commerceId: 'acteur-1',
        pointsGagnes: 17,
        date: new Date(Date.now() - 3 * 86400000).toISOString(),
      },
      {
        id: 'scan-2',
        deviceId: DEMO_DEVICE_ID,
        commerceId: 'acteur-2',
        pointsGagnes: 12,
        date: new Date(Date.now() - 2 * 86400000).toISOString(),
      },
      {
        id: 'scan-3',
        deviceId: DEMO_DEVICE_ID,
        commerceId: 'acteur-3',
        pointsGagnes: 15,
        date: new Date(Date.now() - 86400000).toISOString(),
      },
    ],
    privilegeConsommations: [
      {
        id: 'privilege-1',
        deviceId: DEMO_DEVICE_ID,
        commerceId: 'acteur-2',
        offreVip: 'Café offert',
        date: new Date(Date.now() - 2 * 86400000).toISOString(),
      },
      {
        id: 'privilege-2',
        deviceId: DEMO_DEVICE_ID,
        commerceId: 'acteur-1',
        offreVip: '-10% sur votre prochain achat',
        date: new Date(Date.now() - 86400000).toISOString(),
      },
      {
        id: 'privilege-3',
        deviceId: 'carnet-visiteur',
        commerceId: 'acteur-2',
        offreVip: 'Café offert',
        date: new Date(Date.now() - 5 * 3600000).toISOString(),
      },
    ],
    civicReports: [
      {
        id: 'report-1',
        subcategoryId: 'voirie_proprete' as const,
        channel: CivicReportChannel.Mairie,
        lieu: 'Cours Portal, devant le n°45',
        details: 'Dépôt sauvage de cartons et encombrants sur le trottoir depuis deux jours.',
        statut: CivicReportStatus.Nouveau,
        langue: 'fr',
        createdAt: new Date(Date.now() - 6 * 3600000).toISOString(),
        updatedAt: new Date(Date.now() - 6 * 3600000).toISOString(),
      },
      {
        id: 'report-2',
        subcategoryId: 'eclairage_public' as const,
        channel: CivicReportChannel.Mairie,
        lieu: 'Rue Notre-Dame, angle Rue Borie',
        details: 'Lampadaire éteint depuis une semaine, passage sombre le soir.',
        statut: CivicReportStatus.Valide,
        langue: 'fr',
        createdAt: new Date(Date.now() - 2 * 86400000).toISOString(),
        updatedAt: new Date(Date.now() - 86400000).toISOString(),
      },
      {
        id: 'report-3',
        subcategoryId: 'nuisances_sonores' as const,
        channel: CivicReportChannel.Police,
        lieu: 'Quai des Chartrons, terrasse côté fleuve',
        details: 'Musique amplifiée après 23h plusieurs soirs cette semaine.',
        statut: CivicReportStatus.Transmis,
        langue: 'fr',
        createdAt: new Date(Date.now() - 4 * 86400000).toISOString(),
        updatedAt: new Date(Date.now() - 3 * 86400000).toISOString(),
      },
    ],
  };

  return {
    ...seed,
    acteursLocaux: [
      ...seed.acteursLocaux.map(({ specialiteFine, ...acteur }): ActeurLocal => {
        const rule =
          acteur.id === 'acteur-2'
            ? { mode: FideliteRegleMode.Visite, valeur: 5 }
            : defaultRegleForCategory(acteur.categorie);
        return {
          ...acteur,
          regleFideliteMode: rule.mode,
          regleFideliteValeur: rule.valeur,
          menu: acteur.id === 'acteur-2' ? createCafeMarcheMenu() : null,
          appointmentUrl:
            acteur.id === 'acteur-5'
              ? 'https://www.doctolib.fr/'
              : acteur.id === 'acteur-10'
                ? 'https://www.planity.com/'
                : null,
          rating: null,
          reviewsCount: null,
          openingHours: null,
          specialite: specialiteFine,
          pinCode: DEFAULT_MERCHANT_PIN,
          merchantEmail: defaultMerchantEmail(acteur.nomCommerce),
          socialLinks:
            acteur.id === 'acteur-2'
              ? normalizeSocialLinks({
                  instagram: 'https://www.instagram.com/cafedumarchechartrons/',
                  facebook: 'https://www.facebook.com/cafedumarchechartrons',
                  whatsapp: 'https://wa.me/33556481202',
                  website: 'https://www.cafedumarche-chartrons.fr/',
                })
              : emptySocialLinks(),
          isMerchant: true,
          isVip: acteur.id === 'acteur-1' || acteur.id === 'acteur-2',
          phoneForOrders: acteur.telephone,
          dailyMenuText:
            acteur.id === 'acteur-2' ? 'Plat du jour : Tartiflette aux cèpes' : null,
          dailyMenuImage:
            acteur.id === 'acteur-2'
              ? 'https://images.unsplash.com/photo-1547592166-23ac45744acd?auto=format&fit=crop&w=800&q=80'
              : null,
          dailyMenuStatus: acteur.id === 'acteur-2' ? ArdoiseStatus.Approved : ArdoiseStatus.Pending,
          dailyMenuSubmittedAt: acteur.id === 'acteur-2' ? now : null,
        };
      }),
      ...createChartronsPoiActeurs(now),
    ],
    relaisCreneaux: syncRelaisCreneauxWindow(
      seed.relaisCreneaux,
      seed.localRelais,
      new Date(),
      seed.relaisSettings?.[0],
    ),
  };
}

export const seedData = createSeedData();
