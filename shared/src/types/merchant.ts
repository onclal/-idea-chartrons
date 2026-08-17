import type { ActeurLocal } from './models.js';

/** Fiche commerce (annuaire / carte). `isVip` sépare le compte gratuit de l’Espace Pro. */
export type Merchant = ActeurLocal;

export function isVipMerchant(merchant: Pick<ActeurLocal, 'isVip'> | null | undefined): boolean {
  return merchant?.isVip === true;
}
