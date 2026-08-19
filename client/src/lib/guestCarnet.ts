import { DEMO_DEVICE_ID, generateCarnetToken } from '@idea-chartrons/shared';
import { clearReceipts } from './receipts';
import { writeLocalStorage } from './storage';

/**
 * Mode invité intégral : ni compte, ni profil, ni session.
 *
 * Ce module remplace l'ancienne notion d'utilisateur par deux éléments strictement locaux :
 *  - un identifiant d'appareil (`deviceId`) qui porte le carnet de fidélité ;
 *  - un registre des contenus publiés depuis ce navigateur, pour permettre leur édition
 *    sans jamais rattacher un contenu à une identité.
 *
 * Rien n'est envoyé à un serveur d'authentification : tout vit dans le `localStorage`.
 */

const DEVICE_KEY = 'idea-chartrons-carnet-device';
const OWNED_POSTS_KEY = 'idea-chartrons-mes-annonces';

function randomDeviceId(): string {
  const random =
    typeof crypto !== 'undefined' && 'randomUUID' in crypto
      ? crypto.randomUUID().replace(/-/g, '').slice(0, 10)
      : Math.random().toString(36).slice(2, 12);
  return `carnet-${random}`;
}

/**
 * Identifiant du carnet de cet appareil. À la première visite, on reprend le carnet
 * de démonstration afin que l'historique d'exemple soit visible immédiatement.
 */
export function getDeviceId(): string {
  try {
    const stored = localStorage.getItem(DEVICE_KEY);
    if (stored?.trim()) return stored.trim();
    writeLocalStorage(DEVICE_KEY, DEMO_DEVICE_ID);
    return DEMO_DEVICE_ID;
  } catch {
    return DEMO_DEVICE_ID;
  }
}

/** Repart d'un carnet vierge (nouvel identifiant d'appareil, historique remis à zéro). */
export function resetDeviceId(): string {
  const next = randomDeviceId();
  try {
    writeLocalStorage(DEVICE_KEY, next);
  } catch {
    // Sans stockage, le carnet reste éphémère : ce n'est pas bloquant.
  }
  return next;
}

/** Jeton à présenter en caisse pour créditer le carnet de cet appareil. */
export function getCarnetToken(): string {
  return generateCarnetToken(getDeviceId());
}

/* ------------------------------------------------------------------ *
 * Registre local des contributions
 * ------------------------------------------------------------------ */

function readOwnedIds(): string[] {
  try {
    const raw = localStorage.getItem(OWNED_POSTS_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed.filter((id): id is string => typeof id === 'string') : [];
  } catch {
    return [];
  }
}

function writeOwnedIds(ids: string[]): void {
  try {
    writeLocalStorage(OWNED_POSTS_KEY, JSON.stringify([...new Set(ids)].slice(-200)));
  } catch {
    // ignore
  }
}

/** Annonces publiées depuis cet appareil (droit d'édition purement local). */
export function getOwnedPostIds(): string[] {
  return readOwnedIds();
}

export function rememberOwnedPost(postId: string): void {
  if (!postId) return;
  writeOwnedIds([...readOwnedIds(), postId]);
}

export function forgetOwnedPost(postId: string): void {
  writeOwnedIds(readOwnedIds().filter((id) => id !== postId));
}

export function ownsPost(postId: string): boolean {
  return readOwnedIds().includes(postId);
}

/** Oublie toutes les contributions mémorisées et repart d'un carnet neuf. */
export function clearGuestTraces(): void {
  try {
    localStorage.removeItem(OWNED_POSTS_KEY);
    localStorage.removeItem(DEVICE_KEY);
  } catch {
    // ignore
  }
  clearReceipts();
}
