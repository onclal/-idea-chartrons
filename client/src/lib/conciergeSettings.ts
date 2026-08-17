import { CONCIERGE_MAX_RESULTS } from '@idea-chartrons/shared';
import { writeLocalStorage } from './storage';

/**
 * Réglages du concierge IA, pilotés depuis le panneau d'administration.
 *
 * Ils vivent dans le navigateur de l'administrateur (mode invité : aucun compte côté serveur)
 * et sont transmis à chaque requête `/api/concierge`, qui les applique au prompt système.
 */
export interface ConciergeSettings {
  /** Consignes ajoutées au prompt système (ton, priorités saisonnières, partenariats). */
  extraInstructions: string;
  /** Recadre les questions hors quartier des Chartrons. */
  blockOffTopic: boolean;
  /** Autorise le rappel des numéros d'urgence (15, 17, 18, 112). */
  emergencyNumbers: boolean;
  /** Nombre maximum d'adresses recommandées (1 à CONCIERGE_MAX_RESULTS). */
  maxResults: number;
}

export interface ConciergeUsage {
  /** Nombre total de questions posées depuis cet appareil. */
  questions: number;
  /** Réponses produites par l'API OpenAI. */
  openaiReplies: number;
  /** Réponses produites par le moteur local (hors ligne ou sans clé API). */
  localReplies: number;
  /** Questions détectées hors périmètre du quartier. */
  offTopic: number;
  lastAskedAt: string | null;
}

const SETTINGS_KEY = 'idea-chartrons-concierge-settings';
const USAGE_KEY = 'idea-chartrons-concierge-usage';

export const DEFAULT_CONCIERGE_SETTINGS: ConciergeSettings = {
  extraInstructions: '',
  blockOffTopic: true,
  emergencyNumbers: true,
  maxResults: CONCIERGE_MAX_RESULTS,
};

const EMPTY_USAGE: ConciergeUsage = {
  questions: 0,
  openaiReplies: 0,
  localReplies: 0,
  offTopic: 0,
  lastAskedAt: null,
};

function clampResults(value: unknown): number {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) return CONCIERGE_MAX_RESULTS;
  return Math.min(CONCIERGE_MAX_RESULTS, Math.max(1, Math.round(parsed)));
}

export function loadConciergeSettings(): ConciergeSettings {
  try {
    const raw = localStorage.getItem(SETTINGS_KEY);
    if (!raw) return DEFAULT_CONCIERGE_SETTINGS;
    const parsed = JSON.parse(raw) as Partial<ConciergeSettings>;
    return {
      extraInstructions: String(parsed.extraInstructions ?? '').slice(0, 1200),
      blockOffTopic: parsed.blockOffTopic !== false,
      emergencyNumbers: parsed.emergencyNumbers !== false,
      maxResults: clampResults(parsed.maxResults),
    };
  } catch {
    return DEFAULT_CONCIERGE_SETTINGS;
  }
}

export function saveConciergeSettings(settings: ConciergeSettings): ConciergeSettings {
  const normalized: ConciergeSettings = {
    extraInstructions: settings.extraInstructions.trim().slice(0, 1200),
    blockOffTopic: settings.blockOffTopic,
    emergencyNumbers: settings.emergencyNumbers,
    maxResults: clampResults(settings.maxResults),
  };
  try {
    writeLocalStorage(SETTINGS_KEY, JSON.stringify(normalized));
  } catch {
    // Sans stockage, les réglages restent valables pour la session en cours.
  }
  return normalized;
}

/** Consignes finales envoyées au backend : garde-fous cochés + texte libre de l'admin. */
export function buildConciergeInstructions(settings: ConciergeSettings): string {
  const lines: string[] = [];
  if (settings.blockOffTopic) {
    lines.push(
      'Refuse poliment toute question hors du quartier des Chartrons et propose aussitôt une piste locale.',
    );
  }
  if (!settings.emergencyNumbers) {
    lines.push('Ne cite aucun numéro d’urgence : invite à consulter la page Sécurité de la plateforme.');
  }
  lines.push(`Ne recommande jamais plus de ${settings.maxResults} adresses.`);
  if (settings.extraInstructions.trim()) lines.push(settings.extraInstructions.trim());
  return lines.join('\n');
}

export function loadConciergeUsage(): ConciergeUsage {
  try {
    const raw = localStorage.getItem(USAGE_KEY);
    if (!raw) return EMPTY_USAGE;
    const parsed = JSON.parse(raw) as Partial<ConciergeUsage>;
    return {
      questions: Number(parsed.questions) || 0,
      openaiReplies: Number(parsed.openaiReplies) || 0,
      localReplies: Number(parsed.localReplies) || 0,
      offTopic: Number(parsed.offTopic) || 0,
      lastAskedAt: typeof parsed.lastAskedAt === 'string' ? parsed.lastAskedAt : null,
    };
  } catch {
    return EMPTY_USAGE;
  }
}

/** Compteurs d'usage anonymes : aucun contenu de question n'est conservé. */
export function recordConciergeUsage(outcome: { source: 'openai' | 'local'; isLocalQuery: boolean }): void {
  const current = loadConciergeUsage();
  const next: ConciergeUsage = {
    questions: current.questions + 1,
    openaiReplies: current.openaiReplies + (outcome.source === 'openai' ? 1 : 0),
    localReplies: current.localReplies + (outcome.source === 'local' ? 1 : 0),
    offTopic: current.offTopic + (outcome.isLocalQuery ? 0 : 1),
    lastAskedAt: new Date().toISOString(),
  };
  try {
    writeLocalStorage(USAGE_KEY, JSON.stringify(next));
  } catch {
    // ignore
  }
}

export function resetConciergeUsage(): ConciergeUsage {
  try {
    localStorage.removeItem(USAGE_KEY);
  } catch {
    // ignore
  }
  return EMPTY_USAGE;
}
