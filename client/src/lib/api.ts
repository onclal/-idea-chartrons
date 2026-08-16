import type {
  ActeurLocal,
  ActeurLocalCategory,
  CommerceMenuSection,
  AgendaEvenement,
  CarteFideliteScan,
  EventType,
  FideliteNiveau,
  PostAnnonce,
  PostStatus,
  PostType,
  PreferredLanguage,
  RelaisCreneau,
  RelaisCreneauType,
  RelaisSettings,
  User,
  UserRole,
} from '@idea-chartrons/shared';
import { localDb, withDelay, resetLocalDb } from './localDb';
import { getMenus, updateMenus, upsertAppointmentLink } from './gbp';
import { loadContactMessages, saveContactMessage, type ContactMessage } from './contact';

export interface FideliteScanResult {
  scan: CarteFideliteScan;
  pointsGagnes: number;
  breakdown: {
    base: number;
    firstScanBonus: number;
    verifiedBonus: number;
    total: number;
  };
  totalPoints: number;
  commerce: string;
  niveau: FideliteNiveau;
  vipUnlocked: string | null;
}

export interface FideliteHistoryEntry extends CarteFideliteScan {
  commerceNom: string;
}

export interface FideliteCommerceHistoryEntry extends CarteFideliteScan {
  clientNom: string;
}

export interface FideliteAwardResult {
  scan: CarteFideliteScan;
  pointsGagnes: number;
  totalPoints: number;
  clientNom: string;
  clientId: string;
  commerce: string;
  niveau: FideliteNiveau;
  vipUnlocked: string | null;
}

export interface VipStatusEntry {
  commerceId: string;
  commerceNom: string;
  offreVip: string | null;
  pointsRequis: number;
  unlocked: boolean;
  niveau: FideliteNiveau;
}

export const api = {
  getUsers: () => withDelay(() => localDb.getUsers()),
  getUser: (id: string) => withDelay(() => localDb.getUser(id)),
  getPosts: () => withDelay(() => localDb.getPosts()),
  createPost: (data: {
    titre: string;
    description: string;
    type: PostType;
    prix: number | null;
    photos: string[];
    auteurId: string;
    statut?: PostStatus;
    telephone?: string | null;
  }) => withDelay(() => localDb.createPost(data)),
  updatePost: (postId: string, patch: Partial<Omit<PostAnnonce, 'id' | 'createdAt'>>) =>
    withDelay(() => localDb.updatePost(postId, patch)),
  deletePost: (postId: string) => withDelay(() => {
    localDb.deletePost(postId);
    return { ok: true };
  }),
  getActeurs: () => withDelay(() => localDb.getAll('acteursLocaux')),
  createActeur: (data: {
    userId: string;
    nomCommerce: string;
    categorie: ActeurLocalCategory;
    description: string;
    adresse: string;
    photos: string[];
    offreVip: string | null;
    pointsRequisVip: number;
    activerFidelite?: boolean;
    telephone?: string | null;
    appointmentUrl?: string | null;
  }) => withDelay(() => localDb.createActeur(data)),
  generateQrVitrine: (acteurId: string) => withDelay(() => localDb.generateQrVitrine(acteurId)),
  updateActeur: (
    acteurId: string,
    patch: Partial<Omit<ActeurLocal, 'id' | 'createdAt' | 'qrCodeVitrine'>>,
  ) => withDelay(() => localDb.updateActeur(acteurId, patch)),
  getActeurMenu: (acteurId: string) => withDelay(() => getMenus(acteurId)),
  updateActeurMenu: (acteurId: string, menu: CommerceMenuSection[]) =>
    withDelay(() => updateMenus(acteurId, menu)),
  updateAppointmentLink: (acteurId: string, url: string | null) =>
    withDelay(() => upsertAppointmentLink(acteurId, url)),
  deleteActeur: (acteurId: string) => withDelay(() => {
    localDb.deleteActeur(acteurId);
    return { ok: true };
  }),
  getEvents: () => withDelay(() => localDb.getAll('agendaEvenements')),
  createEvent: (data: {
    organisateurId: string;
    titre: string;
    description: string;
    dateDebut: string;
    dateFin: string;
    image: string | null;
    type: EventType;
  }) => withDelay(() => localDb.createEvent(data)),
  updateEvent: (
    eventId: string,
    patch: Partial<Omit<AgendaEvenement, 'id' | 'createdAt'>>,
  ) => withDelay(() => localDb.updateEvent(eventId, patch)),
  deleteEvent: (eventId: string) => withDelay(() => {
    localDb.deleteEvent(eventId);
    return { ok: true };
  }),
  createUser: (data: {
    nom: string;
    email: string;
    role: UserRole;
    badgeVerifie: boolean;
    adresse: string;
    languePreferee: PreferredLanguage;
    pointsFidelite: number;
  }) => withDelay(() => localDb.createUser(data)),
  updateUser: (userId: string, patch: Partial<Omit<User, 'id' | 'createdAt'>>) =>
    withDelay(() => localDb.updateUser(userId, patch)),
  getRelais: () => withDelay(() => localDb.getRelais()),
  getRelaisByUser: (userId: string) => withDelay(() => localDb.getRelaisByUser(userId)),
  getCreneaux: (type?: RelaisCreneauType) =>
    withDelay(() => localDb.getCreneaux(type)),
  getAllCreneaux: () => withDelay((): RelaisCreneau[] => localDb.getAllCreneaux()),
  getRelaisSettings: () => withDelay((): RelaisSettings => localDb.getRelaisSettings()),
  updateRelaisSettings: (patch: Partial<Omit<RelaisSettings, 'id'>>) =>
    withDelay(() => localDb.updateRelaisSettings(patch)),
  setCreneauBlocked: (creneauId: string, blocked: boolean) =>
    withDelay(() => localDb.setCreneauBlocked(creneauId, blocked)),
  proposeDepotLocal: (data: { postId: string; userId: string; creneauDepotId: string }) =>
    withDelay(() => localDb.proposeDepotLocal(data)),
  reserverRetrait: (relaisId: string, creneauRetraitId: string) =>
    withDelay(() => localDb.reserverRetrait(relaisId, creneauRetraitId)),
  avancerStatutRelais: (relaisId: string) =>
    withDelay(() => localDb.avancerStatutRelais(relaisId)),
  scanFidelite: (data: { userId: string; commerceId: string; qrCode: string }) =>
    withDelay(() => localDb.scanFidelite(data)),
  awardFidelite: (data: { commerceId: string; clientToken: string; montant?: number }) =>
    withDelay(() => localDb.awardFidelite(data)),
  getFideliteHistory: (userId: string) => withDelay(() => localDb.getFideliteHistory(userId)),
  getCommerceFideliteHistory: (commerceId: string) =>
    withDelay(() => localDb.getCommerceFideliteHistory(commerceId)),
  getVipStatus: (userId: string) => withDelay(() => localDb.getVipStatus(userId)),
  getFidelite: () => withDelay(() => localDb.getAll('cartesFideliteScans')),
  getTourDeControle: () => withDelay(() => localDb.getTourDeControle()),
  sendContact: (data: { name: string; email: string; message: string; context: string }) =>
    withDelay(() => saveContactMessage(data)),
  getContactMessages: () => withDelay((): ContactMessage[] => loadContactMessages()),
  resetDemoData: () => withDelay(() => {
    resetLocalDb();
    return { ok: true };
  }),
  health: () => Promise.resolve({ status: 'ok', app: 'IDÉA CHARTRONS', version: '1.0.0' }),
};
