import { ActeurLocalCategory } from './enums.js';
import type { ActeurLocal } from './models.js';
import type { BusinessType, MerchantTier } from './poi.js';

/** Fiche commerce (annuaire / carte). `isVip` distingue une vitrine enrichie, sans compte. */
export type Merchant = ActeurLocal;

export function isVipMerchant(merchant: Pick<ActeurLocal, 'isVip'> | null | undefined): boolean {
  return merchant?.isVip === true;
}

export function isPremiumProMerchant(
  merchant: Pick<ActeurLocal, 'isVip' | 'tier'> | null | undefined,
): boolean {
  return merchant?.tier === 'premium_pro' || isVipMerchant(merchant);
}

export function merchantTierOf(
  merchant: Pick<ActeurLocal, 'isVip' | 'tier'> | null | undefined,
): MerchantTier {
  return isPremiumProMerchant(merchant) ? 'premium_pro' : 'free';
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

export function merchantBusinessType(
  merchant: Pick<ActeurLocal, 'businessType' | 'subcategory' | 'categorie' | 'appointmentUrl'> | null | undefined,
): BusinessType {
  if (merchant?.businessType) return merchant.businessType;
  if (!merchant) return 'commerce_collect';
  if (
    merchant.subcategory === 'restauration_cafes' ||
    merchant.categorie === ActeurLocalCategory.RestaurationMenus ||
    merchant.categorie === ActeurLocalCategory.BarsNightlife
  ) {
    return 'restaurant';
  }
  if (
    merchant.subcategory === 'patrimoine_tourisme' ||
    merchant.categorie === ActeurLocalCategory.TourismeConciergerie
  ) {
    return 'institution';
  }
  if (
    merchant.subcategory === 'services_proximite' ||
    merchant.categorie === ActeurLocalCategory.SanteSoinsServices ||
    Boolean(merchant.appointmentUrl)
  ) {
    return 'service_rdv';
  }
  return 'commerce_collect';
}

export type MerchantActionModule = 'book_table' | 'book_appointment' | 'click_collect';

export function merchantActionModule(
  merchant: ActeurLocal | null | undefined,
): MerchantActionModule | null {
  if (!isPremiumProMerchant(merchant) || !merchant) return null;
  const type = merchantBusinessType(merchant);
  if (type === 'restaurant') return 'book_table';
  if (type === 'service_rdv') return 'book_appointment';
  if (type === 'commerce_collect') return 'click_collect';
  return null;
}

export function merchantWebsiteUrl(
  merchant: Pick<ActeurLocal, 'isVip' | 'tier' | 'socialLinks'> | null | undefined,
): string | null {
  if (!isPremiumProMerchant(merchant)) return null;
  const url = String(merchant?.socialLinks?.website ?? '').trim();
  return url || null;
}

export function canClickAndCollect(merchant: ActeurLocal | null | undefined): boolean {
  return merchantActionModule(merchant) === 'click_collect' && Boolean(merchantOrderPhone(merchant));
}

export function canBookTable(merchant: ActeurLocal | null | undefined): boolean {
  return merchantActionModule(merchant) === 'book_table' && Boolean(merchantOrderPhone(merchant) || merchant?.appointmentUrl);
}
