import { ActeurLocalCategory, FideliteNiveau, FideliteRegleMode } from '../types/enums.js';
import type { ActeurLocal, CarteFideliteScan } from '../types/models.js';

const BASE_POINTS: Record<ActeurLocalCategory, number> = {
  [ActeurLocalCategory.RestaurationMenus]: 8,
  [ActeurLocalCategory.BarsNightlife]: 8,
  [ActeurLocalCategory.SanteSoinsServices]: 6,
  [ActeurLocalCategory.StartupsB2B]: 6,
  [ActeurLocalCategory.CommercesArtisanat]: 8,
  [ActeurLocalCategory.TourismeConciergerie]: 5,
};

const FIRST_SCAN_BONUS = 5;
const SCAN_COOLDOWN_MS = 24 * 60 * 60 * 1000;

export interface PointsCalculation {
  base: number;
  firstScanBonus: number;
  total: number;
}

/** Points d'un passage, calculés à partir de l'historique de l'appareil uniquement. */
export function calculateScanPoints(
  acteur: ActeurLocal,
  previousScans: CarteFideliteScan[],
): PointsCalculation {
  const base = BASE_POINTS[acteur.categorie] ?? 5;
  const hasScannedToday = previousScans.some(
    (s) =>
      s.commerceId === acteur.id &&
      Date.now() - new Date(s.date).getTime() < SCAN_COOLDOWN_MS,
  );

  if (hasScannedToday) {
    return { base: 0, firstScanBonus: 0, total: 0 };
  }

  const hasScannedBefore = previousScans.some((s) => s.commerceId === acteur.id);
  const firstScanBonus = hasScannedBefore ? 0 : FIRST_SCAN_BONUS;

  return { base, firstScanBonus, total: base + firstScanBonus };
}

/** Total de points du carnet : dérivé de l'historique, jamais stocké sur un profil. */
export function totalCarnetPoints(scans: CarteFideliteScan[]): number {
  return scans.reduce((sum, scan) => sum + (Number(scan.pointsGagnes) || 0), 0);
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

export const CARNET_TOKEN_PREFIX = 'QR-CARNET-';

/** Jeton présenté en caisse : identifie un carnet d'appareil, pas une personne. */
export function generateCarnetToken(deviceId: string): string {
  const slug = deviceId
    .toUpperCase()
    .replace(/[^A-Z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
  return `${CARNET_TOKEN_PREFIX}${slug || 'INVITE'}`;
}

/** Extrait l'identifiant d'appareil d'un jeton saisi ou scanné par le commerce. */
export function parseCarnetToken(token: string): string | null {
  const compact = String(token ?? '').trim().replace(/\s+/g, '').toUpperCase();
  if (!compact) return null;
  const raw = compact.startsWith(CARNET_TOKEN_PREFIX)
    ? compact.slice(CARNET_TOKEN_PREFIX.length)
    : compact;
  const slug = raw.replace(/[^A-Z0-9-]+/g, '');
  return slug.length >= 4 ? slug : null;
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

export function isVipUnlocked(carnetPoints: number, acteur: ActeurLocal): boolean {
  if (!acteur.offreVip) return false;
  return carnetPoints >= acteur.pointsRequisVip;
}

export function getVipProgress(carnetPoints: number, acteur: ActeurLocal): number {
  if (!acteur.offreVip || acteur.pointsRequisVip === 0) return 100;
  return Math.min(100, Math.round((carnetPoints / acteur.pointsRequisVip) * 100));
}
