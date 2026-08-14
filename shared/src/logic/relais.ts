import { LocalRelaisRetraitStatus } from '../types/enums.js';
import type { LocalRelais, RelaisCreneau } from '../types/models.js';

export function getRelaisDisplayStatus(statut: LocalRelaisRetraitStatus): LocalRelaisRetraitStatus {
  return statut;
}

export function isReadyForPickup(relais: LocalRelais): boolean {
  return relais.statutRetrait === LocalRelaisRetraitStatus.DisponibleAuLocal;
}

export function isCreneauAvailable(creneau: RelaisCreneau): boolean {
  return creneau.reserves < creneau.capacite;
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
