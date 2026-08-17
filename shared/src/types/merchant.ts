import type { ActeurLocal } from './models.js';

/** Fiche commerce (annuaire / carte). `isVip` sépare le compte gratuit de l’Espace Pro. */
export type Merchant = ActeurLocal;

export function isVipMerchant(merchant: Pick<ActeurLocal, 'isVip'> | null | undefined): boolean {
  return merchant?.isVip === true;
}

export function merchantOrderPhone(
  merchant: Pick<ActeurLocal, 'phoneForOrders' | 'telephone'> | null | undefined,
): string | null {
  const raw = String(merchant?.phoneForOrders ?? merchant?.telephone ?? '').trim();
  return raw || null;
}

export function hasDailySpecial(
  merchant: Pick<ActeurLocal, 'dailyMenuImage' | 'dailyMenuText'> | null | undefined,
): boolean {
  return Boolean(merchant?.dailyMenuText?.trim() || merchant?.dailyMenuImage?.trim());
}

export function canClickAndCollect(merchant: ActeurLocal | null | undefined): boolean {
  return isVipMerchant(merchant) && Boolean(merchantOrderPhone(merchant));
}
