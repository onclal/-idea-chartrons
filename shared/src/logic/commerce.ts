import { ActeurLocalCategory } from '../types/enums.js';
import type {
  ActeurLocal,
  CommerceMenuItem,
  CommerceMenuSection,
  PlatformSettings,
} from '../types/models.js';

export const DEFAULT_TRANSACTION_FEE_EUR = 1;
export const PLATFORM_SETTINGS_ID = 'default';
export const DEFAULT_MENU_SECTION_TITLES = ['Entrées', 'Plats', 'Desserts', 'Boissons'] as const;

export function createDefaultPlatformSettings(): PlatformSettings {
  return {
    id: PLATFORM_SETTINGS_ID,
    transactionFee: DEFAULT_TRANSACTION_FEE_EUR,
  };
}

export function normalizePlatformSettings(input?: Partial<PlatformSettings> | null): PlatformSettings {
  const fee = Number(input?.transactionFee);
  return {
    id: PLATFORM_SETTINGS_ID,
    transactionFee:
      Number.isFinite(fee) && fee >= 0 ? Math.round(fee * 100) / 100 : DEFAULT_TRANSACTION_FEE_EUR,
    updatedAt: input?.updatedAt,
  };
}

export function computeCheckoutTotal(itemPrice: number, transactionFee = DEFAULT_TRANSACTION_FEE_EUR) {
  const price = Number.isFinite(itemPrice) && itemPrice > 0 ? itemPrice : 0;
  const fee = Number.isFinite(transactionFee) && transactionFee >= 0 ? transactionFee : DEFAULT_TRANSACTION_FEE_EUR;
  return { itemPrice: price, transactionFee: fee, total: price + fee };
}

export function isRestaurantCategory(categorie: ActeurLocalCategory | string): boolean {
  return categorie === ActeurLocalCategory.RestaurationMenus;
}

export function isServiceCategory(categorie: ActeurLocalCategory | string): boolean {
  return categorie === ActeurLocalCategory.SanteSoinsServices;
}

export function sanitizeExternalUrl(value: string | null | undefined): string | null {
  const trimmed = String(value ?? '').trim();
  if (!trimmed) return null;
  try {
    const url = new URL(trimmed);
    if (url.protocol !== 'http:' && url.protocol !== 'https:') return null;
    return url.toString();
  } catch {
    return null;
  }
}

export function normalizeMenuItem(item: Partial<CommerceMenuItem> | null | undefined, index = 0): CommerceMenuItem {
  const prix = Number(item?.prix);
  return {
    id: item?.id?.trim() || `plat-${index + 1}`,
    nom: String(item?.nom ?? '').trim(),
    description: String(item?.description ?? '').trim(),
    prix: Number.isFinite(prix) && prix >= 0 ? Math.round(prix * 100) / 100 : 0,
  };
}

export function normalizeMenu(menu: CommerceMenuSection[] | null | undefined): CommerceMenuSection[] {
  return (menu ?? [])
    .map((section, sectionIndex) => ({
      id: section?.id?.trim() || `section-${sectionIndex + 1}`,
      titre: String(section?.titre ?? '').trim(),
      items: (section?.items ?? []).map((item, itemIndex) => normalizeMenuItem(item, itemIndex)).filter((item) => item.nom),
    }))
    .filter((section) => section.titre || section.items.length > 0);
}

export function createEmptyMenu(): CommerceMenuSection[] {
  return DEFAULT_MENU_SECTION_TITLES.map((titre, index) => ({
    id: `section-${index + 1}`,
    titre,
    items: [],
  }));
}

export function createCafeMarcheMenu(): CommerceMenuSection[] {
  return [
    {
      id: 'section-entrees',
      titre: 'Entrées',
      items: [
        {
          id: 'plat-veloute',
          nom: 'Velouté du marché',
          description: 'Légumes du dimanche, huile de noix et croûtons.',
          prix: 8,
        },
        {
          id: 'plat-planche',
          nom: 'Planche de charcuterie',
          description: 'Sélection locale, pickles et pain de campagne.',
          prix: 12,
        },
      ],
    },
    {
      id: 'section-plats',
      titre: 'Plats',
      items: [
        {
          id: 'plat-menu-jour',
          nom: 'Menu du jour',
          description: 'Plat du chef selon arrivage, accompagné d’une salade.',
          prix: 16,
        },
        {
          id: 'plat-omelette',
          nom: 'Omelette aux cèpes',
          description: 'Œufs fermiers, cèpes poêlés et persillade.',
          prix: 14,
        },
      ],
    },
    {
      id: 'section-desserts',
      titre: 'Desserts',
      items: [
        {
          id: 'plat-canele',
          nom: 'Canelé bordelais',
          description: 'Croustillant, cœur fondant, vanille et rhum.',
          prix: 3,
        },
        {
          id: 'plat-tarte',
          nom: 'Tarte du jour',
          description: 'Pâtisserie maison selon les fruits de saison.',
          prix: 6,
        },
      ],
    },
    {
      id: 'section-boissons',
      titre: 'Boissons',
      items: [
        {
          id: 'plat-cafe',
          nom: 'Café',
          description: 'Expresso ou allongé, torréfaction locale.',
          prix: 2,
        },
        {
          id: 'plat-bordeaux',
          nom: 'Verre de Bordeaux',
          description: 'Sélection du quartier, rouge ou blanc.',
          prix: 5,
        },
      ],
    },
  ];
}

export function acteurHasMenu(acteur: Pick<ActeurLocal, 'categorie' | 'menu'>): boolean {
  return isRestaurantCategory(acteur.categorie) && normalizeMenu(acteur.menu).some((section) => section.items.length > 0);
}

export function acteurHasAppointment(acteur: Pick<ActeurLocal, 'categorie' | 'appointmentUrl'>): boolean {
  return isServiceCategory(acteur.categorie) && Boolean(sanitizeExternalUrl(acteur.appointmentUrl));
}
