import { ActeurLocalCategory, FideliteNiveau, FideliteRegleMode } from '../types/enums.js';
import type { ActeurLocal, CarteFideliteScan, User } from '../types/models.js';

const BASE_POINTS: Record<ActeurLocalCategory, number> = {
  [ActeurLocalCategory.RestaurationMenus]: 8,
  [ActeurLocalCategory.BarsNightlife]: 8,
  [ActeurLocalCategory.SanteSoinsServices]: 6,
  [ActeurLocalCategory.StartupsB2B]: 6,
  [ActeurLocalCategory.CommercesArtisanat]: 8,
  [ActeurLocalCategory.TourismeConciergerie]: 5,
};

const FIRST_SCAN_BONUS = 5;
const VERIFIED_USER_BONUS = 2;
const SCAN_COOLDOWN_MS = 24 * 60 * 60 * 1000;

export interface PointsCalculation {
  base: number;
  firstScanBonus: number;
  verifiedBonus: number;
  total: number;
}

export function calculateScanPoints(
  acteur: ActeurLocal,
  user: User,
  previousScans: CarteFideliteScan[],
): PointsCalculation {
  const base = BASE_POINTS[acteur.categorie] ?? 5;
  const hasScannedToday = previousScans.some(
    (s) =>
      s.commerceId === acteur.id &&
      Date.now() - new Date(s.date).getTime() < SCAN_COOLDOWN_MS,
  );

  if (hasScannedToday) {
    return { base: 0, firstScanBonus: 0, verifiedBonus: 0, total: 0 };
  }

  const hasScannedBefore = previousScans.some((s) => s.commerceId === acteur.id);
  const firstScanBonus = hasScannedBefore ? 0 : FIRST_SCAN_BONUS;
  const verifiedBonus = user.badgeVerifie ? VERIFIED_USER_BONUS : 0;

  return {
    base,
    firstScanBonus,
    verifiedBonus,
    total: base + firstScanBonus + verifiedBonus,
  };
}

export function canScanAgain(
  acteurId: string,
  previousScans: CarteFideliteScan[],
): boolean {
  return !previousScans.some(
    (s) =>
      s.commerceId === acteurId &&
      Date.now() - new Date(s.date).getTime() < SCAN_COOLDOWN_MS,
  );
}

export function getFideliteNiveau(points: number): FideliteNiveau {
  if (points >= 100) return FideliteNiveau.Or;
  if (points >= 50) return FideliteNiveau.Argent;
  return FideliteNiveau.Bronze;
}

export function hasQrVitrine(acteur: ActeurLocal): acteur is ActeurLocal & { qrCodeVitrine: string } {
  return Boolean(acteur.qrCodeVitrine);
}

export function generateQrVitrineCode(nomCommerce: string): string {
  const slug = nomCommerce
    .toUpperCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^A-Z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 16);
  return `QR-VITRINE-${slug || 'COMMERCE'}-${String(Date.now()).slice(-4)}`;
}

export function generateQrClientCode(userId: string): string {
  const slug = userId
    .toUpperCase()
    .replace(/[^A-Z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
  return `QR-CLIENT-${slug || 'HABITANT'}`;
}

export interface FideliteRegle {
  mode: FideliteRegleMode;
  valeur: number;
}

export const DEFAULT_FIDELITE_REGLE: FideliteRegle = {
  mode: FideliteRegleMode.Visite,
  valeur: 5,
};

export function defaultRegleForCategory(categorie: ActeurLocalCategory): FideliteRegle {
  switch (categorie) {
    case ActeurLocalCategory.RestaurationMenus:
    case ActeurLocalCategory.BarsNightlife:
    case ActeurLocalCategory.CommercesArtisanat:
      return { mode: FideliteRegleMode.ChiffreAffaires, valeur: 1 };
    case ActeurLocalCategory.SanteSoinsServices:
      return { mode: FideliteRegleMode.Forfait, valeur: 20 };
    case ActeurLocalCategory.TourismeConciergerie:
      return { mode: FideliteRegleMode.Forfait, valeur: 50 };
    default:
      return { ...DEFAULT_FIDELITE_REGLE };
  }
}

export function getActeurFideliteRegle(acteur: ActeurLocal): FideliteRegle {
  const mode = Object.values(FideliteRegleMode).includes(acteur.regleFideliteMode)
    ? acteur.regleFideliteMode
    : DEFAULT_FIDELITE_REGLE.mode;
  const valeur = Number(acteur.regleFideliteValeur);
  return {
    mode,
    valeur: Number.isFinite(valeur) && valeur > 0 ? valeur : DEFAULT_FIDELITE_REGLE.valeur,
  };
}

export function calculateAwardPoints(regle: FideliteRegle, montant?: number): number {
  if (regle.mode === FideliteRegleMode.ChiffreAffaires) {
    const amount = Number(montant);
    if (!Number.isFinite(amount) || amount <= 0) return 0;
    return Math.max(1, Math.round(amount * regle.valeur));
  }
  const points = Math.round(regle.valeur);
  return points > 0 ? points : 0;
}

export function findUserByClientToken(users: User[], token: string): User | undefined {
  const compact = token.trim().replace(/\s+/g, '');
  if (!compact) return undefined;
  const upper = compact.toUpperCase();
  return users.find((user) => {
    const qr = (user.qrCodeClient || generateQrClientCode(user.id)).toUpperCase();
    return (
      user.id === compact ||
      user.id.toUpperCase() === upper ||
      qr === upper ||
      generateQrClientCode(user.id).toUpperCase() === upper
    );
  });
}

export function isVipUnlocked(userPoints: number, acteur: ActeurLocal): boolean {
  if (!acteur.offreVip) return false;
  return userPoints >= acteur.pointsRequisVip;
}

export function getVipProgress(userPoints: number, acteur: ActeurLocal): number {
  if (!acteur.offreVip || acteur.pointsRequisVip === 0) return 100;
  return Math.min(100, Math.round((userPoints / acteur.pointsRequisVip) * 100));
}
