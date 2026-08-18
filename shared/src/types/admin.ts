import type { ChartronsSubcategory } from '../data/taxonomy.js';
import { matchesSearchQuery } from '../logic/search.js';
import type { BusinessType, ChartronsPoi, MerchantTier } from './poi.js';
import type { NeighborhoodPost } from './post.js';

export type AdminRole = 'super_admin';

export interface AdminPoiFilters {
  query: string;
  businessType: BusinessType | 'all';
  tier: MerchantTier | 'all';
  subcategory: ChartronsSubcategory | 'all';
}

export interface AdminModerationState {
  pendingPostIds: string[];
  pendingCivicReportIds: string[];
  pendingArdoiseIds: string[];
}

export interface AdminCapabilities {
  managePois: true;
  moderatePosts: true;
  moderateCivicReports: true;
  moderateArdoises: true;
  managePremiumPro: true;
  manageFaq: true;
}

/**
 * État Super-Admin : contrôle intégral de l’annuaire (POI curés + OSM)
 * et de la modération (annonces, signalements, ardoises).
 */
export interface AdminState {
  role: AdminRole;
  authenticated: boolean;
  poiCount: number;
  pois: ChartronsPoi[];
  selectedPoiId: string | null;
  filters: AdminPoiFilters;
  moderation: AdminModerationState;
  capabilities: AdminCapabilities;
  posts: NeighborhoodPost[];
}

const SUPER_ADMIN_CAPABILITIES: AdminCapabilities = {
  managePois: true,
  moderatePosts: true,
  moderateCivicReports: true,
  moderateArdoises: true,
  managePremiumPro: true,
  manageFaq: true,
};

export const EMPTY_ADMIN_FILTERS: AdminPoiFilters = {
  query: '',
  businessType: 'all',
  tier: 'all',
  subcategory: 'all',
};

export function createSuperAdminState(input: {
  pois: ChartronsPoi[];
  posts?: NeighborhoodPost[];
  pendingPostIds?: string[];
  pendingCivicReportIds?: string[];
  pendingArdoiseIds?: string[];
  selectedPoiId?: string | null;
  authenticated?: boolean;
}): AdminState {
  return {
    role: 'super_admin',
    authenticated: input.authenticated ?? true,
    poiCount: input.pois.length,
    pois: input.pois,
    selectedPoiId: input.selectedPoiId ?? null,
    filters: { ...EMPTY_ADMIN_FILTERS },
    moderation: {
      pendingPostIds: input.pendingPostIds ?? [],
      pendingCivicReportIds: input.pendingCivicReportIds ?? [],
      pendingArdoiseIds: input.pendingArdoiseIds ?? [],
    },
    capabilities: SUPER_ADMIN_CAPABILITIES,
    posts: input.posts ?? [],
  };
}

export function filterAdminPois(state: AdminState): ChartronsPoi[] {
  const { query, businessType, tier, subcategory } = state.filters;
  const needle = query.trim().toLowerCase();
  return state.pois.filter((poi) => {
    if (businessType !== 'all' && poi.businessType !== businessType) return false;
    if (tier !== 'all' && poi.tier !== tier) return false;
    if (subcategory !== 'all' && poi.subcategory !== subcategory) return false;
    if (!needle) return true;
    return matchesSearchQuery(`${poi.name} ${poi.specialty} ${poi.address} ${poi.description}`, query);
  });
}
