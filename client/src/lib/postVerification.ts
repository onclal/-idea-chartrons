import {
  createPostVerification,
  firstPostRequiresOtp,
  isCompleteOtp,
  verifyPostOtp,
  type PostVerification,
  type PostVerificationChannel,
} from '@idea-chartrons/shared';
import { getOwnedPostIds } from './guestCarnet';
import { writeLocalStorage } from './storage';

const PENDING_KEY = 'idea-chartrons-post-otp';
const VERIFIED_KEY = 'idea-chartrons-post-verified';

interface StoredVerifiedContact {
  channel: PostVerificationChannel;
  target: string;
  verifiedAt: string;
}

function readJson<T>(key: string): T | null {
  try {
    const raw = sessionStorage.getItem(key) ?? localStorage.getItem(key);
    if (!raw) return null;
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
}

export function hasVerifiedFirstPost(): boolean {
  if (getOwnedPostIds().length > 0) return true;
  const stored = readJson<StoredVerifiedContact>(VERIFIED_KEY);
  return Boolean(stored?.verifiedAt);
}

export function needsFirstPostOtp(): boolean {
  return firstPostRequiresOtp(getOwnedPostIds().length) && !hasVerifiedFirstPost();
}

export function loadPendingPostVerification(): PostVerification | null {
  return readJson<PostVerification>(PENDING_KEY);
}

export function startPostVerification(channel: PostVerificationChannel, target: string): PostVerification {
  const verification = createPostVerification({ channel, target });
  try {
    sessionStorage.setItem(PENDING_KEY, JSON.stringify(verification));
  } catch {
    // ignore
  }
  return verification;
}

export function confirmPostOtp(code: string): PostVerification | null {
  const pending = loadPendingPostVerification();
  if (!pending || !isCompleteOtp(code)) return pending;
  const next = verifyPostOtp(pending, code);
  try {
    sessionStorage.setItem(PENDING_KEY, JSON.stringify(next));
  } catch {
    // ignore
  }
  if (next.status === 'verified') {
    rememberVerifiedContact(next);
  }
  return next;
}

export function rememberVerifiedContact(verification: PostVerification): void {
  const payload: StoredVerifiedContact = {
    channel: verification.channel,
    target: verification.target,
    verifiedAt: verification.verifiedAt ?? new Date().toISOString(),
  };
  writeLocalStorage(VERIFIED_KEY, JSON.stringify(payload));
  try {
    sessionStorage.removeItem(PENDING_KEY);
  } catch {
    // ignore
  }
}
