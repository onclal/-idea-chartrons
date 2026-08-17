export const DB_STORAGE_KEY = 'idea-chartrons-db';
export const SEED_CATALOG_KEY = 'idea-chartrons-seed-catalog';

const AUX_STORAGE_KEYS = [
  'idea-chartrons-contact-messages',
  'idea-chartrons-alertes-vues',
  'idea-chartrons-alertes-notifiees',
] as const;

const AGGRESSIVE_STORAGE_KEYS = [
  ...AUX_STORAGE_KEYS,
  'idea-chartrons-parcours',
  'idea-chartrons-reviews',
] as const;

export function isQuotaError(error: unknown): boolean {
  if (!error || typeof error !== 'object') return false;
  const err = error as { name?: string; code?: number; message?: string };
  return (
    err.name === 'QuotaExceededError' ||
    err.name === 'NS_ERROR_DOM_QUOTA_REACHED' ||
    err.code === 22 ||
    err.code === 1014 ||
    /quota exceeded/i.test(err.message ?? '')
  );
}

export function purgeObsoleteLocalStorage(options?: { aggressive?: boolean }): void {
  const keys = options?.aggressive ? AGGRESSIVE_STORAGE_KEYS : AUX_STORAGE_KEYS;
  for (const key of keys) {
    try {
      localStorage.removeItem(key);
    } catch {
      // ignore
    }
  }
}

export function writeLocalStorage(key: string, value: string): void {
  try {
    localStorage.setItem(key, value);
    return;
  } catch (error) {
    if (!isQuotaError(error)) throw error;
  }

  purgeObsoleteLocalStorage();
  try {
    localStorage.removeItem(key);
    localStorage.setItem(key, value);
    return;
  } catch (retryError) {
    if (!isQuotaError(retryError)) throw retryError;
  }

  purgeObsoleteLocalStorage({ aggressive: true });
  localStorage.removeItem(key);
  localStorage.setItem(key, value);
}
