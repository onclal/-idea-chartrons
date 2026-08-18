import { PostType } from './enums.js';

/** Types d’annonces riveraines, sans compte obligatoire. */
export const NEIGHBORHOOD_POST_KINDS = ['don', 'petit_boulot', 'entraide', 'vente', 'offre_pro', 'anti_gaspi'] as const;
export type NeighborhoodPostKind = (typeof NEIGHBORHOOD_POST_KINDS)[number];

export const NEIGHBORHOOD_POST_KIND_LABELS: Record<NeighborhoodPostKind, { fr: string; en: string }> = {
  don: { fr: 'Don', en: 'Giveaway' },
  petit_boulot: { fr: 'Petit boulot', en: 'Small job' },
  entraide: { fr: 'Entraide', en: 'Mutual aid' },
  vente: { fr: 'Vente', en: 'For sale' },
  offre_pro: { fr: 'Offre pro', en: 'Pro offer' },
  anti_gaspi: { fr: 'Anti-Gaspi', en: 'Anti-waste' },
};

export type PostVerificationChannel = 'email' | 'sms';
export type PostVerificationStatus = 'pending' | 'verified' | 'expired' | 'blocked';

export const POST_OTP_LENGTH = 4;
export const POST_OTP_TTL_MS = 10 * 60 * 1000;
export const POST_OTP_MAX_ATTEMPTS = 5;

/**
 * Validation de la première annonce d’un habitant : OTP 4 chiffres
 * par e-mail ou SMS, sans création de compte.
 */
export interface PostVerification {
  id: string;
  channel: PostVerificationChannel;
  /** E-mail ou numéro de téléphone visé. */
  target: string;
  /** Code à 4 chiffres. Jamais renvoyé au client après l’émission. */
  code: string;
  expiresAt: string;
  verifiedAt: string | null;
  attempts: number;
  status: PostVerificationStatus;
}

export interface NeighborhoodPost {
  id: string;
  kind: NeighborhoodPostKind;
  title: string;
  description: string;
  price: number | null;
  photos: string[];
  contactPhone: string | null;
  contactEmail: string | null;
  authorDisplayName: string | null;
  /** Renseigné tant que la première publication n’est pas validée. */
  verification: PostVerification | null;
  createdAt: string;
  updatedAt: string;
}

const KIND_TO_POST_TYPE: Record<NeighborhoodPostKind, PostType> = {
  don: PostType.Don,
  petit_boulot: PostType.PetitBoulot,
  entraide: PostType.ServiceAide,
  vente: PostType.Vente,
  offre_pro: PostType.OffrePro,
  anti_gaspi: PostType.AntiGaspi,
};

const POST_TYPE_TO_KIND: Record<PostType, NeighborhoodPostKind> = {
  [PostType.Don]: 'don',
  [PostType.PetitBoulot]: 'petit_boulot',
  [PostType.ServiceAide]: 'entraide',
  [PostType.Vente]: 'vente',
  [PostType.OffrePro]: 'offre_pro',
  [PostType.AntiGaspi]: 'anti_gaspi',
};

export function isNeighborhoodPostKind(value: string): value is NeighborhoodPostKind {
  return (NEIGHBORHOOD_POST_KINDS as readonly string[]).includes(value);
}

export function neighborhoodKindToPostType(kind: NeighborhoodPostKind): PostType {
  return KIND_TO_POST_TYPE[kind];
}

export function postTypeToNeighborhoodKind(type: PostType): NeighborhoodPostKind {
  return POST_TYPE_TO_KIND[type] ?? 'entraide';
}

export function generatePostOtp(random: () => number = Math.random): string {
  const digits = Math.floor(random() * 10 ** POST_OTP_LENGTH)
    .toString()
    .padStart(POST_OTP_LENGTH, '0');
  return digits === '0000' ? '1000' : digits;
}

export function normalizeOtpInput(value: string): string {
  return String(value ?? '').replace(/\D/g, '').slice(0, POST_OTP_LENGTH);
}

export function isCompleteOtp(value: string): boolean {
  return normalizeOtpInput(value).length === POST_OTP_LENGTH;
}

export function createPostVerification(input: {
  channel: PostVerificationChannel;
  target: string;
  now?: number;
  random?: () => number;
}): PostVerification {
  const now = input.now ?? Date.now();
  const target = String(input.target ?? '').trim();
  return {
    id: `otp-${now.toString(36)}`,
    channel: input.channel,
    target,
    code: generatePostOtp(input.random),
    expiresAt: new Date(now + POST_OTP_TTL_MS).toISOString(),
    verifiedAt: null,
    attempts: 0,
    status: 'pending',
  };
}

export function verifyPostOtp(
  verification: PostVerification,
  code: string,
  now = Date.now(),
): PostVerification {
  if (verification.status === 'verified') return verification;
  if (verification.status === 'blocked') return verification;

  if (new Date(verification.expiresAt).getTime() <= now) {
    return { ...verification, status: 'expired' };
  }

  const attempts = verification.attempts + 1;
  if (normalizeOtpInput(code) === verification.code) {
    return {
      ...verification,
      attempts,
      status: 'verified',
      verifiedAt: new Date(now).toISOString(),
    };
  }

  if (attempts >= POST_OTP_MAX_ATTEMPTS) {
    return { ...verification, attempts, status: 'blocked' };
  }

  return { ...verification, attempts, status: 'pending' };
}

export function isPostVerificationValid(verification: PostVerification | null | undefined, now = Date.now()): boolean {
  if (!verification || verification.status !== 'verified') return false;
  if (new Date(verification.expiresAt).getTime() <= now) return false;
  return Boolean(verification.verifiedAt);
}

/** La première annonce d’un habitant exige un OTP ; les suivantes, non. */
export function firstPostRequiresOtp(previousPostCount: number): boolean {
  return previousPostCount < 1;
}
