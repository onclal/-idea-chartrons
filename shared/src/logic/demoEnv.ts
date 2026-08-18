/**
 * Isolation des fiches de démonstration (`isDemo` / `is_demo`).
 *
 * Staging : `INCLUDE_DEMO_DATA=true` ou `VITE_INCLUDE_DEMO_DATA=true`.
 * Production : absent ou `false` — le concierge et l’annuaire ignorent ces enregistrements.
 */

export const DEMO_POI_ID_PREFIX = 'demo-';
export const DEMO_ACTEUR_ID_PREFIX = 'acteur-demo-';
export const DEMO_POST_ID_PREFIX = 'post-demo-';

let includeOverride: boolean | null = null;

/** Surcharge runtime (Vite `import.meta.env` côté client, avant le chargement de localDb). */
export function setIncludeDemoDataOverride(value: boolean | null): void {
  includeOverride = value;
}

export function parseBooleanEnv(value: unknown): boolean | undefined {
  if (typeof value === 'boolean') return value;
  if (value == null) return undefined;
  const raw = String(value).trim().toLowerCase();
  if (!raw) return undefined;
  if (['1', 'true', 'yes', 'on'].includes(raw)) return true;
  if (['0', 'false', 'no', 'off'].includes(raw)) return false;
  return undefined;
}

function readProcessEnv(name: 'INCLUDE_DEMO_DATA' | 'VITE_INCLUDE_DEMO_DATA' | 'NODE_ENV'): string | undefined {
  try {
    if (typeof process === 'undefined' || !process.env) return undefined;
    const value = process.env[name];
    return value == null ? undefined : String(value);
  } catch {
    return undefined;
  }
}

/**
 * `true` : le concierge et le seed exposent les commerces `isDemo`.
 * Défaut : inclus hors production (dev / scripts), exclu en `NODE_ENV=production`
 * sauf flag explicite — pour qu’un site de démo pose `VITE_INCLUDE_DEMO_DATA=true`.
 */
export function includeDemoData(): boolean {
  if (includeOverride !== null) return includeOverride;
  const explicit = parseBooleanEnv(
    readProcessEnv('INCLUDE_DEMO_DATA') ?? readProcessEnv('VITE_INCLUDE_DEMO_DATA'),
  );
  if (explicit !== undefined) return explicit;
  return readProcessEnv('NODE_ENV') !== 'production';
}

/** Équivalent de `is_demo = true` (flag + préfixes d’identifiants). */
export function isDemoRecord(item: { isDemo?: boolean; id?: string } | null | undefined): boolean {
  if (!item) return false;
  if (item.isDemo === true) return true;
  const id = item.id ?? '';
  return (
    id.startsWith(DEMO_POI_ID_PREFIX) ||
    id.startsWith(DEMO_ACTEUR_ID_PREFIX) ||
    id.startsWith(DEMO_POST_ID_PREFIX)
  );
}
