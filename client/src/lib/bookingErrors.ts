import { isQuotaError } from './storage';

export function bookingErrorMessage(
  error: unknown,
  t: (key: string) => string,
): string {
  const message = error instanceof Error ? error.message : '';
  if (isQuotaError(error) || message === 'STORAGE_QUOTA' || /quota/i.test(message)) {
    return t('toast.storageFull');
  }
  if (/invalid or full/i.test(message)) {
    return t('toast.slotUnavailable');
  }
  return message || t('common.error');
}
