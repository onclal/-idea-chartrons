import { ActeurLocalCategory, FideliteNiveau } from '../types/enums.js';
import type { ActeurLocal, CarteFideliteScan, User } from '../types/models.js';

const BASE_POINTS: Record<ActeurLocalCategory, number> = {
  [ActeurLocalCategory.Commercant]: 5,
  [ActeurLocalCategory.Artisan]: 8,
  [ActeurLocalCategory.Brocanteur]: 10,
  [ActeurLocalCategory.SanteServices]: 6,
  [ActeurLocalCategory.Liberal]: 6,
  [ActeurLocalCategory.Association]: 5,
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

export function isVipUnlocked(userPoints: number, acteur: ActeurLocal): boolean {
  if (!acteur.offreVip) return false;
  return userPoints >= acteur.pointsRequisVip;
}

export function getVipProgress(userPoints: number, acteur: ActeurLocal): number {
  if (!acteur.offreVip || acteur.pointsRequisVip === 0) return 100;
  return Math.min(100, Math.round((userPoints / acteur.pointsRequisVip) * 100));
}
