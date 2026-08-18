import { parseBooleanEnv, setIncludeDemoDataOverride } from '@idea-chartrons/shared';

/**
 * Applique `VITE_INCLUDE_DEMO_DATA` avant le chargement de localDb.
 * En `npm run dev`, les fiches démo sont incluses par défaut.
 * En build production, elles restent isolées tant que le flag n’est pas `true`.
 */
const explicit = parseBooleanEnv(import.meta.env.VITE_INCLUDE_DEMO_DATA);
setIncludeDemoDataOverride(explicit ?? import.meta.env.DEV);
