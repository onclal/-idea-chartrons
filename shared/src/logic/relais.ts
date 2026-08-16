import { LocalRelaisRetraitStatus, RelaisCreneauType } from '../types/enums.js';
import type { LocalRelais, RelaisCreneau } from '../types/models.js';

export const DEFAULT_CRENEAU_CAPACITE = 3;
export const RELAIS_FRAIS_GESTION_EUR = 1;

export function getRelaisDisplayStatus(statut: LocalRelaisRetraitStatus): LocalRelaisRetraitStatus {
  return statut;
}

export function isReadyForPickup(relais: LocalRelais): boolean {
  return relais.statutRetrait === LocalRelaisRetraitStatus.DisponibleAuLocal;
}

export function normalizeRelaisCreneauType(
  type: string | RelaisCreneauType | null | undefined,
): RelaisCreneauType {
  const value = String(type ?? '').toLowerCase();
  if (value.includes('retrait') || value.includes('pickup')) {
    return RelaisCreneauType.Retrait;
  }
  return RelaisCreneauType.Depot;
}

export function getCreneauCapacite(creneau: Pick<RelaisCreneau, 'capacite'>): number {
  const capacite = Number(creneau.capacite);
  return Number.isFinite(capacite) && capacite > 0 ? capacite : DEFAULT_CRENEAU_CAPACITE;
}

export function getCreneauReserves(creneau: Pick<RelaisCreneau, 'reserves'>): number {
  const reserves = Number(creneau.reserves);
  return Number.isFinite(reserves) && reserves > 0 ? Math.floor(reserves) : 0;
}

export function getCreneauPlacesRestantes(creneau: RelaisCreneau): number {
  return Math.max(0, getCreneauCapacite(creneau) - getCreneauReserves(creneau));
}

export function isCreneauAvailable(creneau: RelaisCreneau): boolean {
  return getCreneauPlacesRestantes(creneau) > 0;
}

export function countSlotBookings(relaisList: LocalRelais[], creneauId: string): number {
  return relaisList.reduce((count, relais) => {
    if (relais.statutRetrait === LocalRelaisRetraitStatus.Recupere) return count;
    if (relais.creneauDepotId === creneauId || relais.creneauRetraitId === creneauId) {
      return count + 1;
    }
    return count;
  }, 0);
}

export function slotFromId(id: string): RelaisCreneau | null {
  const match = /^creneau-(\d{4}-\d{2}-\d{2})-(\d{2}:\d{2})-(Depot|Retrait)$/i.exec(id.trim());
  if (!match) return null;
  const date = match[1];
  const heureDebut = match[2];
  const type = normalizeRelaisCreneauType(match[3]);
  const [hours, minutes] = heureDebut.split(':').map(Number);
  const heureFin = `${String((hours + 1) % 24).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;
  return {
    id: `creneau-${date}-${heureDebut}-${type}`,
    date,
    heureDebut,
    heureFin,
    type,
    capacite: DEFAULT_CRENEAU_CAPACITE,
    reserves: 0,
  };
}

export function countReadyForPickup(relaisList: LocalRelais[], userId: string): number {
  return relaisList.filter(
    (r) => r.userId === userId && isReadyForPickup(r),
  ).length;
}

export function getNextStatus(current: LocalRelaisRetraitStatus): LocalRelaisRetraitStatus | null {
  switch (current) {
    case LocalRelaisRetraitStatus.EnAttente:
      return LocalRelaisRetraitStatus.DisponibleAuLocal;
    case LocalRelaisRetraitStatus.DisponibleAuLocal:
      return LocalRelaisRetraitStatus.Recupere;
    default:
      return null;
  }
}
