import {
  ActeurLocalCategory,
  EventType,
  LocalRelaisRetraitStatus,
  PostStatus,
  PostType,
  PreferredLanguage,
  RelaisCreneauType,
  UserRole,
} from '../types/enums.js';
import type { DatabaseSchema, RelaisCreneau } from '../types/models.js';

function generateCreneaux(): RelaisCreneau[] {
  const creneaux: RelaisCreneau[] = [];
  const slots = [
    { heureDebut: '10:00', heureFin: '11:00' },
    { heureDebut: '11:00', heureFin: '12:00' },
    { heureDebut: '14:00', heureFin: '15:00' },
    { heureDebut: '15:00', heureFin: '16:00' },
    { heureDebut: '16:00', heureFin: '17:00' },
  ];

  for (let day = 0; day < 7; day++) {
    const date = new Date();
    date.setDate(date.getDate() + day);
    const dateStr = date.toISOString().split('T')[0];

    for (const slot of slots) {
      for (const type of [RelaisCreneauType.Depot, RelaisCreneauType.Retrait]) {
        creneaux.push({
          id: `creneau-${dateStr}-${slot.heureDebut}-${type}`,
          date: dateStr,
          heureDebut: slot.heureDebut,
          heureFin: slot.heureFin,
          type,
          capacite: 3,
          reserves: day === 0 && slot.heureDebut === '10:00' ? 1 : 0,
        });
      }
    }
  }

  return creneaux;
}

export function createSeedData(): DatabaseSchema {
  const now = new Date().toISOString();
  const today = new Date().toISOString().split('T')[0];
  const tomorrow = new Date(Date.now() + 86400000).toISOString().split('T')[0];

  return {
    users: [
      {
        id: 'user-1',
        nom: 'Marie Dupont',
        email: 'marie.dupont@chartrons.fr',
        role: UserRole.Habitant,
        badgeVerifie: true,
        adresse: '12 Rue Notre-Dame, 33000 Bordeaux',
        languePreferee: PreferredLanguage.FR,
        pointsFidelite: 120,
        createdAt: now,
        updatedAt: now,
      },
      {
        id: 'user-2',
        nom: 'Thomas Martin',
        email: 'thomas@brocante-chartrons.fr',
        role: UserRole.Commercant,
        badgeVerifie: true,
        adresse: '45 Cours Portal, 33000 Bordeaux',
        languePreferee: PreferredLanguage.FR,
        pointsFidelite: 340,
        createdAt: now,
        updatedAt: now,
      },
      {
        id: 'user-3',
        nom: 'Sophie Bernard',
        email: 'sophie.bernard@chartrons.fr',
        role: UserRole.BenevolRelais,
        badgeVerifie: true,
        adresse: '26 place Jean Jaques Rabaud',
        languePreferee: PreferredLanguage.FR,
        pointsFidelite: 0,
        createdAt: now,
        updatedAt: now,
      },
    ],
    postsAnnonces: [
      {
        id: 'post-1',
        auteurId: 'user-1',
        titre: 'Vélo enfant 14 pouces',
        description: 'Vélo en bon état, idéal pour enfant de 4-6 ans. Quelques traces d\'usage normales.',
        type: PostType.Vente,
        prix: 25,
        statut: PostStatus.DepotLocal,
        photos: ['https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400&h=300&fit=crop'],
        createdAt: now,
        updatedAt: now,
      },
      {
        id: 'post-2',
        auteurId: 'user-3',
        titre: 'Livres de cuisine à donner',
        description: 'Collection de 15 livres de cuisine française. État impeccable.',
        type: PostType.Don,
        prix: null,
        statut: PostStatus.Disponible,
        photos: ['https://images.unsplash.com/photo-1497633768975-a6630d299a24?w=400&h=300&fit=crop'],
        createdAt: now,
        updatedAt: now,
      },
      {
        id: 'post-3',
        auteurId: 'user-1',
        titre: 'Aide bricolage léger',
        description: 'Disponible le week-end pour petits travaux : montage meubles, accrochage tableaux.',
        type: PostType.ServiceAide,
        prix: null,
        statut: PostStatus.Disponible,
        photos: ['https://images.unsplash.com/photo-1581578731548-c64695cc6952?w=400&h=300&fit=crop'],
        createdAt: now,
        updatedAt: now,
      },
      {
        id: 'post-4',
        auteurId: 'user-2',
        titre: 'Arrosage plantes — vacances',
        description: 'Petit boulot : arroser les plantes pendant 2 semaines en août.',
        type: PostType.PetitBoulot,
        prix: 30,
        statut: PostStatus.DepotLocal,
        photos: ['https://images.unsplash.com/photo-1416879595882-3373a0480b5b?w=400&h=300&fit=crop'],
        createdAt: now,
        updatedAt: now,
      },
    ],
    relaisCreneaux: generateCreneaux(),
    localRelais: [
      {
        id: 'relais-1',
        postId: 'post-1',
        userId: 'user-1',
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
        userId: 'user-1',
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
        userId: 'user-2',
        nomCommerce: 'Brocante des Chartrons',
        categorie: ActeurLocalCategory.Brocanteur,
        description: 'Brocante authentique au cœur du quartier. Meubles vintage, vaisselle et objets de charme.',
        adresse: '45 Cours Portal, 33000 Bordeaux',
        photos: ['https://images.unsplash.com/photo-1555041469-a586c12ebb9a?w=400&h=300&fit=crop'],
        offreVip: '-10% sur votre prochain achat',
        pointsRequisVip: 100,
        qrCodeVitrine: 'QR-VITRINE-BROCANTE-001',
        createdAt: now,
        updatedAt: now,
      },
      {
        id: 'acteur-2',
        userId: 'user-2',
        nomCommerce: 'Café du Marché',
        categorie: ActeurLocalCategory.Commercant,
        description: 'Café de quartier avec terrasse ombragée. Pâtisseries maison et produits locaux.',
        adresse: '22 Rue Notre-Dame, 33000 Bordeaux',
        photos: ['https://images.unsplash.com/photo-1501339847302-ac826a8a8145?w=400&h=300&fit=crop'],
        offreVip: 'Café offert',
        pointsRequisVip: 50,
        qrCodeVitrine: 'QR-VITRINE-CAFE-002',
        createdAt: now,
        updatedAt: now,
      },
      {
        id: 'acteur-3',
        userId: 'user-1',
        nomCommerce: 'Atelier Céramique Chartrons',
        categorie: ActeurLocalCategory.Artisan,
        description: 'Céramique artisanale faite main. Ateliers découverte le samedi matin.',
        adresse: '5 Rue Josephine, 33000 Bordeaux',
        photos: ['https://images.unsplash.com/photo-1578749556568-bc2c40a68b24?w=400&h=300&fit=crop'],
        offreVip: 'Atelier découverte -15%',
        pointsRequisVip: 80,
        qrCodeVitrine: 'QR-VITRINE-CERAMIQUE-003',
        createdAt: now,
        updatedAt: now,
      },
      {
        id: 'acteur-4',
        userId: 'user-1',
        nomCommerce: 'Cabinet Infirmier des Chartrons',
        categorie: ActeurLocalCategory.SanteServices,
        description: 'Soins infirmiers de proximité : pansements, suivi à domicile, vaccinations et petits soins du quotidien.',
        adresse: '18 Cours Portal, 33000 Bordeaux',
        photos: ['https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?w=400&h=300&fit=crop'],
        offreVip: null,
        pointsRequisVip: 0,
        qrCodeVitrine: null,
        createdAt: now,
        updatedAt: now,
      },
      {
        id: 'acteur-5',
        userId: 'user-2',
        nomCommerce: 'Clinique Vétérinaire Portal',
        categorie: ActeurLocalCategory.SanteServices,
        description: 'Consultations, urgences et suivi des animaux de compagnie. Accueil sans rendez-vous le matin.',
        adresse: '31 Cours Portal, 33000 Bordeaux',
        photos: ['https://images.unsplash.com/photo-1450778869180-41d0601e016d?w=400&h=300&fit=crop'],
        offreVip: 'Consultation de suivi -10%',
        pointsRequisVip: 60,
        qrCodeVitrine: 'QR-VITRINE-VETO-005',
        createdAt: now,
        updatedAt: now,
      },
    ],
    agendaEvenements: [
      {
        id: 'event-1',
        organisateurId: 'user-2',
        titre: 'Grande Brocante du Dimanche',
        description: 'Brocante mensuelle sur le Cours Portal. Plus de 50 exposants.',
        dateDebut: '2026-08-17T08:00:00.000Z',
        dateFin: '2026-08-17T18:00:00.000Z',
        image: 'https://images.unsplash.com/photo-1598300042247-d088f8ab3a91?w=400&h=300&fit=crop',
        type: EventType.Brocante,
        createdAt: now,
        updatedAt: now,
      },
      {
        id: 'event-2',
        organisateurId: 'user-1',
        titre: 'Apéro des Voisins — Été',
        description: 'Rencontre conviviale sur la place du marché. Apéritif participatif.',
        dateDebut: '2026-08-22T17:00:00.000Z',
        dateFin: '2026-08-22T21:00:00.000Z',
        image: 'https://images.unsplash.com/photo-1530103862676-de8c9debad1d?w=400&h=300&fit=crop',
        type: EventType.AnimationAsso,
        createdAt: now,
        updatedAt: now,
      },
      {
        id: 'event-3',
        organisateurId: 'user-2',
        titre: 'Happy Hour -50%',
        description: 'Promo flash sur tous les cafés et pâtisseries entre 16h et 18h.',
        dateDebut: '2026-08-15T14:00:00.000Z',
        dateFin: '2026-08-15T18:00:00.000Z',
        image: 'https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=400&h=300&fit=crop',
        type: EventType.PromoFlash,
        createdAt: now,
        updatedAt: now,
      },
    ],
    cartesFideliteScans: [
      {
        id: 'scan-1',
        userId: 'user-1',
        commerceId: 'acteur-1',
        pointsGagnes: 17,
        date: new Date(Date.now() - 3 * 86400000).toISOString(),
      },
      {
        id: 'scan-2',
        userId: 'user-1',
        commerceId: 'acteur-2',
        pointsGagnes: 12,
        date: new Date(Date.now() - 2 * 86400000).toISOString(),
      },
      {
        id: 'scan-3',
        userId: 'user-1',
        commerceId: 'acteur-3',
        pointsGagnes: 15,
        date: new Date(Date.now() - 86400000).toISOString(),
      },
    ],
  };
}

export const seedData = createSeedData();

export const DEMO_USER_IDS = ['user-1', 'user-2', 'user-3'] as const;
