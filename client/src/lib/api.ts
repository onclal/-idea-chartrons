import type { CarteFideliteScan, FideliteNiveau } from '@idea-chartrons/shared';
import { localDb, withDelay, resetLocalDb } from './localDb';

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
    type: import('@idea-chartrons/shared').PostType;
    prix: number | null;
    photos: string[];
    auteurId: string;
  }) => withDelay(() => localDb.createPost(data)),
  getRelais: () => withDelay(() => localDb.getRelais()),
  getRelaisByUser: (userId: string) => withDelay(() => localDb.getRelaisByUser(userId)),
  getCreneaux: (type?: import('@idea-chartrons/shared').RelaisCreneauType) =>
    withDelay(() => localDb.getCreneaux(type)),
  proposeDepotLocal: (data: { postId: string; userId: string; creneauDepotId: string }) =>
    withDelay(() => localDb.proposeDepotLocal(data)),
  reserverRetrait: (relaisId: string, creneauRetraitId: string) =>
    withDelay(() => localDb.reserverRetrait(relaisId, creneauRetraitId)),
  avancerStatutRelais: (relaisId: string) =>
    withDelay(() => localDb.avancerStatutRelais(relaisId)),
  getActeurs: () => withDelay(() => localDb.getAll('acteursLocaux')),
  getEvents: () => withDelay(() => localDb.getAll('agendaEvenements')),
  scanFidelite: (data: { userId: string; commerceId: string; qrCode: string }) =>
    withDelay(() => localDb.scanFidelite(data)),
  getFideliteHistory: (userId: string) => withDelay(() => localDb.getFideliteHistory(userId)),
  getVipStatus: (userId: string) => withDelay(() => localDb.getVipStatus(userId)),
  getFidelite: () => withDelay(() => localDb.getAll('cartesFideliteScans')),
  resetDemoData: () => withDelay(() => {
    resetLocalDb();
    return { ok: true };
  }),
  health: () => Promise.resolve({ status: 'ok', app: 'IDÉA CHARTRONS', version: '1.0.0' }),
};
