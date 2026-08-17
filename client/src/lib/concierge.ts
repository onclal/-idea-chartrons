import {
  analyzeConciergeQuery,
  buildLocalConciergeReply,
  conciergePhrasebookLang,
  detectConciergeLang,
  heritageForQuery,
  rankConciergeMatches,
  type BudgetEstimate,
  type BudgetUnit,
  type ConciergeLang,
  type ConciergeRecommendation,
  type StreetHeritage,
} from '@idea-chartrons/shared';
import {
  buildConciergeInstructions,
  loadConciergeSettings,
  recordConciergeUsage,
  type ConciergeSettings,
} from './conciergeSettings';
import { walkingItineraryUrl } from './itinerary';
import { buildSmsHref, buildWhatsAppHref } from './phone';

/** URL de l’API concierge : proxy local en dev, backend distant si configuré. */
const CONCIERGE_ENDPOINT = import.meta.env.VITE_CONCIERGE_API_URL ?? '/api/concierge';

export type ConciergeLangChoice = 'auto' | ConciergeLang;
export type ConciergeSource = 'openai' | 'local';

export interface ConciergeMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  createdAt: string;
  source?: ConciergeSource;
  lang?: ConciergeLang;
  recommendations?: ConciergeRecommendation[];
  heritage?: StreetHeritage[];
}

export interface ConciergeAnswer {
  reply: string;
  source: ConciergeSource;
  lang: ConciergeLang;
  isLocalQuery: boolean;
  recommendations: ConciergeRecommendation[];
  heritage: StreetHeritage[];
}

export interface AskConciergeInput {
  message: string;
  history: ConciergeMessage[];
  lang: ConciergeLangChoice;
  uiLang: string;
}

function resolveLang(choice: ConciergeLangChoice, message: string, uiLang: string): ConciergeLang {
  if (choice !== 'auto') return choice;
  return detectConciergeLang(message, conciergePhrasebookLang(uiLang));
}

/** Réponse calculée entièrement dans le navigateur, sans appel réseau. */
export function localConciergeAnswer(input: AskConciergeInput): ConciergeAnswer {
  const lang = resolveLang(input.lang, input.message, input.uiLang);
  const analysis = analyzeConciergeQuery(input.message);
  const maxResults = loadConciergeSettings().maxResults;
  const recommendations = rankConciergeMatches(analysis).slice(0, maxResults);
  return {
    reply: buildLocalConciergeReply(analysis, recommendations, lang),
    source: 'local',
    lang,
    isLocalQuery: analysis.isLocal,
    recommendations,
    heritage: heritageForQuery(analysis),
  };
}

/**
 * Interroge l’API IA quand elle est disponible et retombe sur le moteur local
 * sinon : le site publié sur GitHub Pages est statique et n’a pas de backend.
 */
export async function askConcierge(input: AskConciergeInput): Promise<ConciergeAnswer> {
  const answer = await requestConcierge(input, loadConciergeSettings());
  recordConciergeUsage(answer);
  return answer;
}

async function requestConcierge(
  input: AskConciergeInput,
  settings: ConciergeSettings,
): Promise<ConciergeAnswer> {
  try {
    const response = await fetch(CONCIERGE_ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        message: input.message,
        lang: input.lang,
        uiLang: input.uiLang,
        instructions: buildConciergeInstructions(settings),
        history: input.history.slice(-6).map((turn) => ({ role: turn.role, content: turn.content })),
      }),
    });
    if (!response.ok) return localConciergeAnswer(input);

    const data = (await response.json()) as Partial<ConciergeAnswer>;
    if (typeof data.reply !== 'string' || !data.reply.trim()) return localConciergeAnswer(input);

    const fallback = localConciergeAnswer(input);
    return {
      reply: data.reply,
      source: data.source === 'openai' ? 'openai' : 'local',
      lang: data.lang ?? fallback.lang,
      isLocalQuery: data.isLocalQuery ?? fallback.isLocalQuery,
      recommendations: (Array.isArray(data.recommendations)
        ? data.recommendations
        : fallback.recommendations
      ).slice(0, settings.maxResults),
      heritage: Array.isArray(data.heritage) ? data.heritage : fallback.heritage,
    };
  } catch {
    return localConciergeAnswer(input);
  }
}

export function formatConciergeBudget(
  budget: BudgetEstimate | null,
  unitLabel: (unit: BudgetUnit) => string,
): string | null {
  if (!budget) return null;
  return `${budget.min}–${budget.max} € ${unitLabel(budget.unit)}`;
}

/** Message de commande pré-rempli, envoyé au commerçant via WhatsApp ou SMS. */
export function buildConciergeOrderText(
  recommendation: ConciergeRecommendation,
  lang: ConciergeLang,
): string {
  const isFrench = lang === 'fr';
  const lines = isFrench
    ? [
        `Bonjour ${recommendation.name},`,
        '',
        'Je vous contacte via IDÉA CHARTRONS (concierge du quartier des Chartrons).',
        'Je souhaiterais passer une commande en Click & Collect :',
        '- Produit / prestation : ',
        '- Quantité : ',
        '- Heure de retrait souhaitée : ',
        '',
        'Merci de me confirmer la disponibilité. Bonne journée !',
      ]
    : [
        `Hello ${recommendation.name},`,
        '',
        'I am contacting you through IDÉA CHARTRONS (the Chartrons district concierge).',
        'I would like to place a Click & Collect order:',
        '- Product / service: ',
        '- Quantity: ',
        '- Preferred pickup time: ',
        '',
        'Could you confirm availability? Thank you!',
      ];
  return lines.join('\n');
}

export function conciergeWhatsAppHref(
  recommendation: ConciergeRecommendation,
  lang: ConciergeLang,
): string | null {
  if (!recommendation.phone) return null;
  return buildWhatsAppHref(recommendation.phone, buildConciergeOrderText(recommendation, lang));
}

export function conciergeSmsHref(
  recommendation: ConciergeRecommendation,
  lang: ConciergeLang,
): string | null {
  if (!recommendation.phone) return null;
  return buildSmsHref(recommendation.phone, buildConciergeOrderText(recommendation, lang));
}

/** Itinéraire piéton Google Maps enchaînant les adresses recommandées. */
export function conciergeWalkingRouteUrl(recommendations: ConciergeRecommendation[]): string | null {
  const stops = recommendations.map((item) => ({
    latitude: item.coordinates.lat,
    longitude: item.coordinates.lng,
  }));
  return walkingItineraryUrl(stops);
}

export const CONCIERGE_LANG_OPTIONS: { value: ConciergeLangChoice; label: string }[] = [
  { value: 'auto', label: 'Auto' },
  { value: 'fr', label: 'Français' },
  { value: 'en', label: 'English' },
  { value: 'es', label: 'Español' },
  { value: 'de', label: 'Deutsch' },
  { value: 'it', label: 'Italiano' },
  { value: 'pt', label: 'Português' },
  { value: 'nl', label: 'Nederlands' },
];
