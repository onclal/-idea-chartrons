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
  RelaisCreneau,
  RelaisCreneauType,
  RelaisSettings,
  PlatformSettings,
  ArdoiseStatus,
  ChartronsSubcategory,
  CivicReport,
  CivicReportChannel,
  CivicReportStatus,
  ReportSubcategoryId,
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

export type FideliteCommerceHistoryEntry = CarteFideliteScan;

export interface FideliteAwardResult {
  scan: CarteFideliteScan;
  pointsGagnes: number;
  totalPoints: number;
  /** Carnet d'appareil crédité, jamais une personne. */
  carnetId: string;
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
  getPosts: () => withDelay(() => localDb.getPosts()),
  createPost: (data: {
    titre: string;
    description: string;
    type: PostType;
    prix: number | null;
    photos: string[];
    auteurNom?: string | null;
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
    nomCommerce: string;
    categorie: ActeurLocalCategory;
    subcategory?: ChartronsSubcategory;
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
    organisateurNom?: string | null;
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
  getRelais: () => withDelay(() => localDb.getRelais()),
  getRelaisByPosts: (postIds: string[]) => withDelay(() => localDb.getRelaisByPosts(postIds)),
  getCreneaux: (type?: RelaisCreneauType) =>
    withDelay(() => localDb.getCreneaux(type)),
  getAllCreneaux: () => withDelay((): RelaisCreneau[] => localDb.getAllCreneaux()),
  getRelaisSettings: () => withDelay((): RelaisSettings => localDb.getRelaisSettings()),
  getPlatformSettings: () => withDelay((): PlatformSettings => localDb.getPlatformSettings()),
  updatePlatformSettings: (patch: Partial<Omit<PlatformSettings, 'id'>>) =>
    withDelay(() => localDb.updatePlatformSettings(patch)),
  updateRelaisSettings: (patch: Partial<Omit<RelaisSettings, 'id'>>) =>
    withDelay(() => localDb.updateRelaisSettings(patch)),
  setCreneauBlocked: (creneauId: string, blocked: boolean) =>
    withDelay(() => localDb.setCreneauBlocked(creneauId, blocked)),
  proposeDepotLocal: (data: { postId: string; deposantNom?: string | null; creneauDepotId: string }) =>
    withDelay(() => localDb.proposeDepotLocal(data)),
  reserverRetrait: (relaisId: string, creneauRetraitId: string) =>
    withDelay(() => localDb.reserverRetrait(relaisId, creneauRetraitId)),
  avancerStatutRelais: (relaisId: string) =>
    withDelay(() => localDb.avancerStatutRelais(relaisId)),
  scanFidelite: (data: { deviceId: string; commerceId: string; qrCode: string }) =>
    withDelay(() => localDb.scanFidelite(data)),
  awardFidelite: (data: { commerceId: string; carnetToken: string; montant?: number }) =>
    withDelay(() => localDb.awardFidelite(data)),
  getFideliteHistory: (deviceId: string) => withDelay(() => localDb.getFideliteHistory(deviceId)),
  getCommerceFideliteHistory: (commerceId: string) =>
    withDelay(() => localDb.getCommerceFideliteHistory(commerceId)),
  getVipStatus: (deviceId: string) => withDelay(() => localDb.getVipStatus(deviceId)),
  getCarnetPoints: (deviceId: string) => withDelay(() => localDb.getCarnetPoints(deviceId)),
  getFidelite: () => withDelay(() => localDb.getAll('cartesFideliteScans')),
  getTourDeControle: () => withDelay(() => localDb.getTourDeControle()),
  getCivicReports: () => withDelay((): CivicReport[] => localDb.getCivicReports()),
  createCivicReport: (data: {
    subcategoryId: ReportSubcategoryId;
    channel: CivicReportChannel;
    lieu: string;
    details: string;
    langue: string;
  }) => withDelay(() => localDb.createCivicReport(data)),
  setCivicReportStatus: (reportId: string, statut: CivicReportStatus) =>
    withDelay(() => localDb.setCivicReportStatus(reportId, statut)),
  deleteCivicReport: (reportId: string) => withDelay(() => {
    localDb.deleteCivicReport(reportId);
    return { ok: true };
  }),
  getPendingArdoises: () => withDelay(() => localDb.getPendingArdoises()),
  setArdoiseStatus: (acteurId: string, statut: ArdoiseStatus) =>
    withDelay(() => localDb.setArdoiseStatus(acteurId, statut)),
  sendContact: (data: { name: string; email: string; message: string; context: string }) =>
    withDelay(() => saveContactMessage(data)),
  getContactMessages: () => withDelay((): ContactMessage[] => loadContactMessages()),
  resetDemoData: () => withDelay(() => {
    resetLocalDb();
    return { ok: true };
  }),
  health: () => Promise.resolve({ status: 'ok', app: 'IDÉA CHARTRONS', version: '1.0.0' }),
};
