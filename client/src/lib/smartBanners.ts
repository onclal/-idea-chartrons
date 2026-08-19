import type { LocaleText } from './locale';
import { loc } from './locale';
import { loadConciergeUsage } from './conciergeSettings';
import { writeLocalStorage } from './storage';

/**
 * Smart notification banners (`smart_banners`).
 *
 * Field mapping (store → spec):
 * title, iconName → icon_name, ctaLabel → cta_label, ctaUrl → cta_url,
 * targetAudience → target_audience, weatherCondition → weather_condition,
 * isActive → is_active, startAt → start_at, endAt → end_at.
 */
export const SMART_BANNERS_KEY = 'idea-chartrons-smart-banners';
export const SMART_BANNER_DISMISS_KEY = 'idea-chartrons-smart-banner-dismissed';
export const SMART_BANNERS_EVENT = 'idea-chartrons-smart-banners';

export const SMART_BANNER_ROTATION_MS = 8000;
const DISMISS_TTL_MS = 24 * 60 * 60 * 1000;

export type SmartBannerAudience = 'public' | 'pro_free' | 'pro_paid';
export type SmartBannerTarget = SmartBannerAudience | 'all';
export type WeatherCondition = 'none' | 'rain' | 'storm' | 'flood' | 'heat' | 'wind' | 'agenda';

export interface SmartBanner {
  id: string;
  title: LocaleText;
  iconName: string;
  ctaLabel: LocaleText;
  ctaUrl: string;
  targetAudience: SmartBannerTarget;
  weatherCondition: WeatherCondition;
  isActive: boolean;
  startAt: string | null;
  endAt: string | null;
}

export interface SmartBannerStore {
  banners: SmartBanner[];
  /** Simulated weather used to trigger weather alerts in this guest demo. */
  simulatedWeather: WeatherCondition;
  /** Viewer context: there is no merchant login, so targeting is previewed locally. */
  viewerAudience: SmartBannerAudience;
}

export const SMART_BANNER_ICONS: Record<string, string> = {
  delivery: '🚲',
  filter: '🔎',
  calendar: '📅',
  mail: '✉️',
  spark: '✨',
  badge: '✦',
  pepite: '🏺',
  chart: '📊',
  deal: '🏷️',
  rain: '🌧️',
  storm: '⛈️',
  flood: '🌊',
  heat: '🌡️',
  wind: '💨',
  alert: '⚠️',
  sun: '☀️',
};

export const WEATHER_CONDITIONS: WeatherCondition[] = [
  'none',
  'rain',
  'storm',
  'flood',
  'heat',
  'wind',
  'agenda',
];

export const BANNER_TARGETS: SmartBannerTarget[] = ['public', 'pro_free', 'pro_paid', 'all'];

const ALERT_WEATHER: ReadonlySet<WeatherCondition> = new Set([
  'rain',
  'storm',
  'flood',
  'heat',
  'wind',
  'agenda',
]);

function txt(fr: string, en: string): LocaleText {
  return { fr, en };
}

export const DEFAULT_SMART_BANNERS: SmartBanner[] = [
  {
    id: 'sb-public-delivery',
    title: txt(
      'Livraison à domicile : filtrez les commerces qui livrent',
      'Home delivery: filter shops that deliver',
    ),
    iconName: 'delivery',
    ctaLabel: txt('Voir', 'See'),
    ctaUrl: '/acteurs',
    targetAudience: 'public',
    weatherCondition: 'none',
    isActive: true,
    startAt: null,
    endAt: null,
  },
  {
    id: 'sb-public-filters',
    title: txt(
      'Affinez l’annuaire par métier, rue ou accessibilité',
      'Refine the directory by trade, street or accessibility',
    ),
    iconName: 'filter',
    ctaLabel: txt('Explorer', 'Browse'),
    ctaUrl: '/acteurs',
    targetAudience: 'public',
    weatherCondition: 'none',
    isActive: true,
    startAt: null,
    endAt: null,
  },
  {
    id: 'sb-public-agenda',
    title: txt('Agenda du quartier : ateliers, apéros, brocantes', 'Neighborhood calendar: workshops, apéros, flea markets'),
    iconName: 'calendar',
    ctaLabel: txt('Agenda', 'Calendar'),
    ctaUrl: '/events',
    targetAudience: 'public',
    weatherCondition: 'none',
    isActive: true,
    startAt: null,
    endAt: null,
  },
  {
    id: 'sb-public-newsletter',
    title: txt('Recevoir les infos du quartier par e-mail', 'Get neighborhood news by email'),
    iconName: 'mail',
    ctaLabel: txt('S’inscrire', 'Sign up'),
    ctaUrl: 'mailto:contact@chartrons.fr?subject=Newsletter%20ID%C3%89A%20Chartrons',
    targetAudience: 'public',
    weatherCondition: 'none',
    isActive: true,
    startAt: null,
    endAt: null,
  },
  {
    id: 'sb-pro-free-upgrade',
    title: txt(
      'Passez en Pro Brocanteur : plus de visibilité rue Notre-Dame',
      'Upgrade to Pro Brocanteur: more visibility on rue Notre-Dame',
    ),
    iconName: 'spark',
    ctaLabel: txt('Passer Pro', 'Go Pro'),
    ctaUrl: '/acteurs?referencer=1',
    targetAudience: 'pro_free',
    weatherCondition: 'none',
    isActive: true,
    startAt: null,
    endAt: null,
  },
  {
    id: 'sb-pro-free-badge',
    title: txt(
      'Badge Notre-Dame : le repère des vitrines du quartier',
      'Notre-Dame badge: the landmark of neighborhood shopfronts',
    ),
    iconName: 'badge',
    ctaLabel: txt('Découvrir', 'Discover'),
    ctaUrl: '/brocanteurs',
    targetAudience: 'pro_free',
    weatherCondition: 'none',
    isActive: true,
    startAt: null,
    endAt: null,
  },
  {
    id: 'sb-pro-free-pepites',
    title: txt(
      '10 emplacements Pépites inclus — publiez vos arrivages',
      '10 Pépites slots included — publish your new finds',
    ),
    iconName: 'pepite',
    ctaLabel: txt('Pépites', 'Finds'),
    ctaUrl: '/brocanteurs',
    targetAudience: 'pro_free',
    weatherCondition: 'none',
    isActive: true,
    startAt: null,
    endAt: null,
  },
  {
    id: 'sb-pro-paid-stats',
    title: txt('{{count}} recherches ce mois sur votre vitrine', '{{count}} searches this month on your shopfront'),
    iconName: 'chart',
    ctaLabel: txt('Détail', 'Details'),
    ctaUrl: '/acteurs',
    targetAudience: 'pro_paid',
    weatherCondition: 'none',
    isActive: true,
    startAt: null,
    endAt: null,
  },
  {
    id: 'sb-pro-paid-agenda',
    title: txt('Rappel agenda : pensez à relayer vos événements', 'Calendar reminder: share your upcoming events'),
    iconName: 'calendar',
    ctaLabel: txt('Agenda', 'Calendar'),
    ctaUrl: '/events',
    targetAudience: 'pro_paid',
    weatherCondition: 'none',
    isActive: true,
    startAt: null,
    endAt: null,
  },
  {
    id: 'sb-alert-rain',
    title: txt(
      'Pluie sur les quais : préférez les passages couverts',
      'Rain on the quays: prefer covered passages',
    ),
    iconName: 'rain',
    ctaLabel: txt('Guide', 'Guide'),
    ctaUrl: '/pratique',
    targetAudience: 'all',
    weatherCondition: 'rain',
    isActive: true,
    startAt: null,
    endAt: null,
  },
  {
    id: 'sb-alert-agenda',
    title: txt(
      'Alerte agenda : foire du Cours Portal ce week-end',
      'Calendar alert: Cours Portal fair this weekend',
    ),
    iconName: 'alert',
    ctaLabel: txt('Voir', 'See'),
    ctaUrl: '/events',
    targetAudience: 'all',
    weatherCondition: 'agenda',
    isActive: false,
    startAt: null,
    endAt: null,
  },
];

const DEFAULT_STORE: SmartBannerStore = {
  banners: DEFAULT_SMART_BANNERS,
  simulatedWeather: 'none',
  viewerAudience: 'public',
};

function emitChange(): void {
  if (typeof window === 'undefined') return;
  window.dispatchEvent(new Event(SMART_BANNERS_EVENT));
}

function asLocaleText(value: unknown, fallback = ''): LocaleText {
  if (value && typeof value === 'object' && 'fr' in value) {
    const rec = value as { fr?: unknown; en?: unknown };
    const fr = String(rec.fr ?? fallback);
    return { fr, en: String(rec.en ?? fr) };
  }
  if (typeof value === 'string' && value.trim()) {
    return { fr: value, en: value };
  }
  return { fr: fallback, en: fallback };
}

function asWeather(value: unknown): WeatherCondition {
  return WEATHER_CONDITIONS.includes(value as WeatherCondition) ? (value as WeatherCondition) : 'none';
}

function asTarget(value: unknown): SmartBannerTarget {
  return BANNER_TARGETS.includes(value as SmartBannerTarget) ? (value as SmartBannerTarget) : 'public';
}

function asAudience(value: unknown): SmartBannerAudience {
  return value === 'pro_free' || value === 'pro_paid' || value === 'public' ? value : 'public';
}

function asIso(value: unknown): string | null {
  if (typeof value !== 'string' || !value.trim()) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : value;
}

export function normalizeSmartBanner(raw: Partial<SmartBanner> & { id?: string }): SmartBanner {
  return {
    id: String(raw.id ?? '').trim() || `sb-${Date.now().toString(36)}`,
    title: asLocaleText(raw.title),
    iconName: String(raw.iconName ?? 'spark').trim() || 'spark',
    ctaLabel: asLocaleText(raw.ctaLabel, 'Voir'),
    ctaUrl: String(raw.ctaUrl ?? '').trim() || '/',
    targetAudience: asTarget(raw.targetAudience),
    weatherCondition: asWeather(raw.weatherCondition),
    isActive: raw.isActive !== false,
    startAt: asIso(raw.startAt),
    endAt: asIso(raw.endAt),
  };
}

export function emptySmartBanner(): Omit<SmartBanner, 'id'> {
  return {
    title: txt('', ''),
    iconName: 'spark',
    ctaLabel: txt('Voir', 'See'),
    ctaUrl: '/',
    targetAudience: 'public',
    weatherCondition: 'none',
    isActive: true,
    startAt: null,
    endAt: null,
  };
}

export function loadSmartBannerStore(): SmartBannerStore {
  try {
    const raw = localStorage.getItem(SMART_BANNERS_KEY);
    if (!raw) return { ...DEFAULT_STORE, banners: [...DEFAULT_SMART_BANNERS] };
    const parsed = JSON.parse(raw) as Partial<SmartBannerStore>;
    const banners = Array.isArray(parsed.banners)
      ? parsed.banners.map((item) => normalizeSmartBanner(item as Partial<SmartBanner>))
      : [...DEFAULT_SMART_BANNERS];
    return {
      banners,
      simulatedWeather: asWeather(parsed.simulatedWeather),
      viewerAudience: asAudience(parsed.viewerAudience),
    };
  } catch {
    return { ...DEFAULT_STORE, banners: [...DEFAULT_SMART_BANNERS] };
  }
}

export function saveSmartBannerStore(store: SmartBannerStore): SmartBannerStore {
  const next: SmartBannerStore = {
    banners: store.banners.map((banner) => normalizeSmartBanner(banner)),
    simulatedWeather: asWeather(store.simulatedWeather),
    viewerAudience: asAudience(store.viewerAudience),
  };
  try {
    writeLocalStorage(SMART_BANNERS_KEY, JSON.stringify(next));
  } catch {
    // Session-only if storage is full.
  }
  emitChange();
  return next;
}

function mutateStore(patch: (store: SmartBannerStore) => SmartBannerStore): SmartBannerStore {
  return saveSmartBannerStore(patch(loadSmartBannerStore()));
}

export function listSmartBanners(): SmartBanner[] {
  return loadSmartBannerStore().banners;
}

export function addSmartBanner(input: Partial<SmartBanner>): SmartBanner {
  const banner = normalizeSmartBanner({
    ...emptySmartBanner(),
    ...input,
    id: input.id || `sb-${Date.now().toString(36)}`,
  });
  mutateStore((store) => ({ ...store, banners: [...store.banners, banner] }));
  return banner;
}

export function updateSmartBanner(id: string, patch: Partial<SmartBanner>): SmartBanner | null {
  let updated: SmartBanner | null = null;
  mutateStore((store) => ({
    ...store,
    banners: store.banners.map((banner) => {
      if (banner.id !== id) return banner;
      updated = normalizeSmartBanner({ ...banner, ...patch, id: banner.id });
      return updated;
    }),
  }));
  return updated;
}

export function toggleSmartBanner(id: string): SmartBanner | null {
  const current = listSmartBanners().find((banner) => banner.id === id);
  if (!current) return null;
  return updateSmartBanner(id, { isActive: !current.isActive });
}

export function removeSmartBanner(id: string): void {
  mutateStore((store) => ({
    ...store,
    banners: store.banners.filter((banner) => banner.id !== id),
  }));
}

export function setSimulatedWeather(weather: WeatherCondition): SmartBannerStore {
  return mutateStore((store) => ({ ...store, simulatedWeather: asWeather(weather) }));
}

export function setBannerAudience(audience: SmartBannerAudience): SmartBannerStore {
  return mutateStore((store) => ({ ...store, viewerAudience: asAudience(audience) }));
}

export function getBannerAudience(): SmartBannerAudience {
  return loadSmartBannerStore().viewerAudience;
}

export function bannerIcon(iconName: string): string {
  return SMART_BANNER_ICONS[iconName] ?? SMART_BANNER_ICONS.spark;
}

export function isAlertBanner(banner: SmartBanner): boolean {
  return ALERT_WEATHER.has(banner.weatherCondition);
}

function inSchedule(banner: SmartBanner, now: Date): boolean {
  const ts = now.getTime();
  if (banner.startAt) {
    const start = new Date(banner.startAt).getTime();
    if (!Number.isNaN(start) && ts < start) return false;
  }
  if (banner.endAt) {
    const end = new Date(banner.endAt).getTime();
    if (!Number.isNaN(end) && ts > end) return false;
  }
  return true;
}

function matchesAudience(banner: SmartBanner, audience: SmartBannerAudience): boolean {
  return banner.targetAudience === 'all' || banner.targetAudience === audience;
}

function alertApplies(banner: SmartBanner, weather: WeatherCondition): boolean {
  if (!isAlertBanner(banner)) return false;
  if (banner.weatherCondition === 'agenda') return true;
  return weather !== 'none' && banner.weatherCondition === weather;
}

export function visibleSmartBanners(
  audience: SmartBannerAudience = getBannerAudience(),
  now: Date = new Date(),
  weather: WeatherCondition = loadSmartBannerStore().simulatedWeather,
): SmartBanner[] {
  const eligible = listSmartBanners().filter(
    (banner) => banner.isActive && inSchedule(banner, now) && matchesAudience(banner, audience),
  );
  const alerts = eligible.filter((banner) => alertApplies(banner, weather));
  if (alerts.length > 0) return alerts;
  return eligible.filter((banner) => !isAlertBanner(banner));
}

export function interpolateBannerText(text: string, vars: { count: number }): string {
  return text.replaceAll('{{count}}', String(vars.count));
}

export function resolveBannerTitle(banner: SmartBanner, lang: string): string {
  const count = loadConciergeUsage().questions || 42;
  return interpolateBannerText(loc(lang, banner.title), { count });
}

export function resolveBannerCta(banner: SmartBanner, lang: string): string {
  return loc(lang, banner.ctaLabel).trim();
}

export function dismissSmartBannerStrip(): void {
  try {
    writeLocalStorage(SMART_BANNER_DISMISS_KEY, JSON.stringify({ until: Date.now() + DISMISS_TTL_MS }));
  } catch {
    // ignore
  }
  emitChange();
}

export function isSmartBannerDismissed(now: number = Date.now()): boolean {
  try {
    const raw = localStorage.getItem(SMART_BANNER_DISMISS_KEY);
    if (!raw) return false;
    const parsed = JSON.parse(raw) as { until?: number };
    return typeof parsed.until === 'number' && parsed.until > now;
  } catch {
    return false;
  }
}

/** Hides the strip after dismiss for 24h. Emergency vs marketing is decided before this. */
export function bannersForDisplay(
  audience?: SmartBannerAudience,
  now?: Date,
): { banners: SmartBanner[]; emergency: boolean } {
  if (isSmartBannerDismissed(now?.getTime())) {
    return { banners: [], emergency: false };
  }
  const items = visibleSmartBanners(audience, now);
  return { banners: items, emergency: items.some(isAlertBanner) };
}
