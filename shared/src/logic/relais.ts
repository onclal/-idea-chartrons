import { LocalRelaisRetraitStatus, RelaisCreneauType } from '../types/enums.js';
import type { LocalRelais, RelaisCreneau, RelaisHorairesPlage, RelaisSettings } from '../types/models.js';

export const DEFAULT_CRENEAU_CAPACITE = 3;
export const RELAIS_FRAIS_GESTION_EUR = 1;
export const ONLINE_PAYMENT_FEE_EUR = 1;
export const RELAIS_SETTINGS_ID = 'default';
export const DEFAULT_OPENING_DAYS = [0, 1, 2, 3, 4, 5, 6];
export const DEFAULT_RELAIS_PLAGES: RelaisHorairesPlage[] = [
  { heureDebut: '10:00', heureFin: '12:00' },
  { heureDebut: '14:00', heureFin: '17:00' },
];

export function createDefaultRelaisSettings(): RelaisSettings {
  return {
    id: RELAIS_SETTINGS_ID,
    openingDays: [...DEFAULT_OPENING_DAYS],
    plages: DEFAULT_RELAIS_PLAGES.map((plage) => ({ ...plage })),
    defaultCapacite: DEFAULT_CRENEAU_CAPACITE,
  };
}

function parseHm(value: string): number | null {
  const match = /^(\d{1,2}):(\d{2})/.exec(String(value ?? '').trim());
  if (!match) return null;
  const hours = Number(match[1]);
  const minutes = Number(match[2]);
  if (!Number.isFinite(hours) || !Number.isFinite(minutes) || hours > 23 || minutes > 59) {
    return null;
  }
  return hours * 60 + minutes;
}

function formatHm(totalMinutes: number): string {
  const hours = Math.floor(totalMinutes / 60) % 24;
  const minutes = totalMinutes % 60;
  return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;
}

export function weekdayFromYmd(ymd: string): number {
  const [year, month, day] = ymd.split('-').map(Number);
  return new Date(year, (month ?? 1) - 1, day ?? 1).getDay();
}

export function expandPlagesToHourSlots(plages: RelaisHorairesPlage[]): RelaisHorairesPlage[] {
  const slots: RelaisHorairesPlage[] = [];
  const seen = new Set<string>();
  for (const plage of plages ?? []) {
    const start = parseHm(plage.heureDebut);
    const end = parseHm(plage.heureFin);
    if (start == null || end == null || end <= start) continue;
    for (let cursor = start; cursor + 60 <= end; cursor += 60) {
      const heureDebut = formatHm(cursor);
      const heureFin = formatHm(cursor + 60);
      const key = `${heureDebut}-${heureFin}`;
      if (seen.has(key)) continue;
      seen.add(key);
      slots.push({ heureDebut, heureFin });
    }
  }
  return slots;
}

export function normalizeRelaisSettings(input?: Partial<RelaisSettings> | null): RelaisSettings {
  const openingDays = Array.isArray(input?.openingDays)
    ? [...new Set(input.openingDays.filter((day) => Number.isInteger(day) && day >= 0 && day <= 6))].sort(
        (a, b) => a - b,
      )
    : [...DEFAULT_OPENING_DAYS];

  const rawPlages = Array.isArray(input?.plages) ? input.plages : DEFAULT_RELAIS_PLAGES;
  const plages = rawPlages
    .map((plage) => {
      const start = parseHm(plage?.heureDebut ?? '');
      const end = parseHm(plage?.heureFin ?? '');
      if (start == null || end == null || end <= start) return null;
      return { heureDebut: formatHm(start), heureFin: formatHm(end) };
    })
    .filter((plage): plage is RelaisHorairesPlage => plage != null);
  const normalizedPlages = plages.length > 0 ? plages : DEFAULT_RELAIS_PLAGES.map((plage) => ({ ...plage }));

  const capacite = Number(input?.defaultCapacite);
  const defaultCapacite =
    Number.isFinite(capacite) && capacite >= 1 ? Math.min(30, Math.floor(capacite)) : DEFAULT_CRENEAU_CAPACITE;

  return {
    id: RELAIS_SETTINGS_ID,
    openingDays,
    plages: normalizedPlages,
    defaultCapacite,
    updatedAt: input?.updatedAt,
  };
}

export function isCreneauBlocked(creneau: Pick<RelaisCreneau, 'blocked'>): boolean {
  return Boolean(creneau.blocked);
}

export function isCreneauOpenBySettings(
  creneau: Pick<RelaisCreneau, 'date' | 'heureDebut'>,
  settings?: RelaisSettings | null,
): boolean {
  const config = normalizeRelaisSettings(settings);
  if (!config.openingDays.includes(weekdayFromYmd(creneau.date))) return false;
  return expandPlagesToHourSlots(config.plages).some((slot) => slot.heureDebut === creneau.heureDebut);
}

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
  return !isCreneauBlocked(creneau) && getCreneauPlacesRestantes(creneau) > 0;
}

export function isCreneauBookable(creneau: RelaisCreneau, settings?: RelaisSettings | null): boolean {
  return isCreneauAvailable(creneau) && isCreneauOpenBySettings(creneau, settings);
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
    blocked: false,
  };
}

/**
 * Colis prêts à retirer parmi les dépôts effectués depuis cet appareil.
 * La propriété est mémorisée localement (aucun compte), d'où la liste d'annonces fournie.
 */
export function countReadyForPickup(relaisList: LocalRelais[], ownedPostIds: string[]): number {
  const owned = new Set(ownedPostIds);
  return relaisList.filter((r) => owned.has(r.postId) && isReadyForPickup(r)).length;
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
