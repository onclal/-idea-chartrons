import { PostStatus, PostType } from '../types/enums.js';
import type { PostAnnonce } from '../types/models.js';

/** Commission plateforme sur les paiements CB Anti-Gaspi (5 %). */
export const ANTI_GASPI_COMMISSION_RATE = 0.05;
/** Une offre ne peut pas dépasser 7 jours. */
export const ANTI_GASPI_MAX_HORIZON_MS = 7 * 24 * 60 * 60 * 1000;

/** Types autorisés dans le fil habitants « Annonces & Entraide ». */
export const RESIDENT_FEED_POST_TYPES: readonly PostType[] = [
  PostType.Don,
  PostType.Vente,
  PostType.ServiceAide,
  PostType.PetitBoulot,
];

export function isAntiGaspiPost(post: Pick<PostAnnonce, 'type'>): boolean {
  return post.type === PostType.AntiGaspi;
}

export function isResidentFeedPost(post: Pick<PostAnnonce, 'type'>): boolean {
  return (RESIDENT_FEED_POST_TYPES as readonly string[]).includes(post.type);
}

export function isAntiGaspiExpired(post: Pick<PostAnnonce, 'type' | 'expiresAt'>, now = Date.now()): boolean {
  if (!isAntiGaspiPost(post) || !post.expiresAt) return false;
  const ts = Date.parse(post.expiresAt);
  return Number.isFinite(ts) && ts <= now;
}

/** Offre visible : Anti-Gaspi, disponible, non expirée. */
export function isActiveAntiGaspiOffer(post: PostAnnonce, now = Date.now()): boolean {
  if (!isAntiGaspiPost(post)) return false;
  if (post.statut !== PostStatus.Disponible) return false;
  if (isAntiGaspiExpired(post, now)) return false;
  return true;
}

/**
 * Archive (Clôturé) les offres Anti-Gaspi dont la date est dépassée,
 * sans toucher aux réservations déjà payées.
 */
export function archiveExpiredAntiGaspiOffers<T extends PostAnnonce>(
  posts: T[],
  now = Date.now(),
): { posts: T[]; changed: boolean } {
  let changed = false;
  const stamp = new Date(now).toISOString();
  const next = posts.map((post) => {
    if (!isAntiGaspiPost(post)) return post;
    if (post.statut === PostStatus.Cloture || post.statut === PostStatus.Reserve) return post;
    if (!isAntiGaspiExpired(post, now)) return post;
    changed = true;
    return { ...post, statut: PostStatus.Cloture, updatedAt: stamp };
  });
  return { posts: next, changed };
}

export function computeAntiGaspiCheckout(
  itemPrice: number,
  commissionRate = ANTI_GASPI_COMMISSION_RATE,
): { itemPrice: number; commissionRate: number; commission: number; total: number } {
  const price = Number.isFinite(itemPrice) && itemPrice > 0 ? itemPrice : 0;
  const rate =
    Number.isFinite(commissionRate) && commissionRate >= 0 ? commissionRate : ANTI_GASPI_COMMISSION_RATE;
  const commission = Math.round(price * rate * 100) / 100;
  return {
    itemPrice: price,
    commissionRate: rate,
    commission,
    total: Math.round((price + commission) * 100) / 100,
  };
}

export function defaultAntiGaspiExpiry(now = Date.now()): string {
  const date = new Date(now);
  date.setHours(20, 0, 0, 0);
  if (date.getTime() <= now) date.setDate(date.getDate() + 1);
  return date.toISOString();
}

export function validateAntiGaspiExpiry(iso: string, now = Date.now()): 'invalid' | 'past' | 'tooFar' | null {
  const ts = Date.parse(iso);
  if (!Number.isFinite(ts)) return 'invalid';
  if (ts <= now) return 'past';
  if (ts - now > ANTI_GASPI_MAX_HORIZON_MS) return 'tooFar';
  return null;
}
