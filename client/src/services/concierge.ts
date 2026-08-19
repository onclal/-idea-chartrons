import {
  conciergePhrasebookLang,
  detectConciergeLang,
  runConciergeEngine,
  sanitizeConciergeReply,
  type ConciergeLang,
  type ConciergeRecommendation,
  type GeoCoordinates,
  type GeoOriginSource,
  type LocalBasket,
  type PostAnnonce,
  type StreetHeritage,
  type AntiqueItem,
  type ActeurLocal,
  type ConciergePersona,
} from '@idea-chartrons/shared';
import { api } from '../lib/api';
import {
  buildConciergeInstructions,
  loadConciergeSettings,
  recordConciergeUsage,
  type ConciergeSettings,
} from '../lib/conciergeSettings';

const CONCIERGE_ENDPOINT = import.meta.env.VITE_CONCIERGE_API_URL ?? '/api/concierge';

export type ConciergeLangChoice = 'auto' | ConciergeLang;
export type ConciergeSource = 'openai' | 'local';

export interface ConciergeTurn {
  role: 'user' | 'assistant';
  content: string;
  recommendations?: ConciergeRecommendation[];
}

export interface ConciergeAnswer {
  reply: string;
  source: ConciergeSource;
  lang: ConciergeLang;
  isLocalQuery: boolean;
  recommendations: ConciergeRecommendation[];
  heritage: StreetHeritage[];
  posts: PostAnnonce[];
  antiqueItems: AntiqueItem[];
  basket: LocalBasket | null;
  checklist: string[];
  persona: ConciergePersona;
}

export interface AskConciergeInput {
  message: string;
  history: ConciergeTurn[];
  lang: ConciergeLangChoice;
  uiLang: string;
  origin?: GeoCoordinates | null;
  originSource?: GeoOriginSource;
  persona?: ConciergePersona;
}

function resolveLang(choice: ConciergeLangChoice, message: string, uiLang: string): ConciergeLang {
  if (choice !== 'auto') return choice;
  return detectConciergeLang(message, conciergePhrasebookLang(uiLang));
}

function lastRecommendations(history: ConciergeTurn[]): ConciergeRecommendation[] | undefined {
  for (let index = history.length - 1; index >= 0; index -= 1) {
    const recs = history[index]?.recommendations;
    if (history[index]?.role === 'assistant' && recs?.length) return recs;
  }
  return undefined;
}

function engineToAnswer(
  input: AskConciergeInput,
  posts: PostAnnonce[],
  antiqueItems: AntiqueItem[],
  acteurs: ActeurLocal[],
  source: ConciergeSource,
  reply?: string,
): ConciergeAnswer {
  const lang = resolveLang(input.lang, input.message, input.uiLang);
  const engine = runConciergeEngine({
    message: input.message,
    history: input.history.map((turn) => ({ role: turn.role, content: turn.content })),
    previousRecommendations: lastRecommendations(input.history),
    posts,
    antiqueItems,
    acteurs,
    persona: input.persona,
    lang,
    maxResults: loadConciergeSettings().maxResults,
    origin: input.origin,
    originSource: input.originSource,
  });
  return {
    reply: reply?.trim() || engine.reply,
    source,
    lang,
    isLocalQuery: engine.analysis.isLocal,
    recommendations: engine.recommendations,
    heritage: engine.heritage,
    posts: engine.posts,
    antiqueItems: engine.antiqueItems,
    basket: engine.basket,
    checklist: engine.checklist,
    persona: engine.persona,
  };
}

/** Moteur multi-sources 100 % local (POI + annonces + recettes). */
export function localConciergeAnswer(
  input: AskConciergeInput,
  posts: PostAnnonce[] = [],
  antiqueItems: AntiqueItem[] = [],
  acteurs: ActeurLocal[] = [],
): ConciergeAnswer {
  return engineToAnswer(input, posts, antiqueItems, acteurs, 'local');
}

async function loadPosts(): Promise<PostAnnonce[]> {
  try {
    return await api.getPosts();
  } catch {
    return [];
  }
}

async function loadAntiqueItems(): Promise<AntiqueItem[]> {
  try {
    return await api.getAntiqueItems();
  } catch {
    return [];
  }
}

async function loadActeurs(): Promise<ActeurLocal[]> {
  try {
    return await api.getActeurs();
  } catch {
    return [];
  }
}

/**
 * Interroge l’API IA quand elle est disponible et retombe sur le moteur local
 * (GitHub Pages statique, hors ligne, clé absente).
 */
export async function askConcierge(input: AskConciergeInput): Promise<ConciergeAnswer> {
  const settings = loadConciergeSettings();
  const [posts, antiqueItems, acteurs] = await Promise.all([loadPosts(), loadAntiqueItems(), loadActeurs()]);
  const answer = await requestConcierge(input, settings, posts, antiqueItems, acteurs);
  recordConciergeUsage(answer);
  return answer;
}

async function requestConcierge(
  input: AskConciergeInput,
  settings: ConciergeSettings,
  posts: PostAnnonce[],
  antiqueItems: AntiqueItem[],
  acteurs: ActeurLocal[],
): Promise<ConciergeAnswer> {
  const fallback = localConciergeAnswer(input, posts, antiqueItems, acteurs);
  try {
    const response = await fetch(CONCIERGE_ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        message: input.message,
        lang: input.lang,
        uiLang: input.uiLang,
        persona: input.persona ?? 'default',
        instructions: buildConciergeInstructions(settings),
        history: input.history.slice(-6).map((turn) => ({ role: turn.role, content: turn.content })),
        origin: input.origin ?? undefined,
        originSource: input.originSource ?? 'fallback',
      }),
    });
    if (!response.ok) return fallback;

    const data = (await response.json()) as Partial<ConciergeAnswer> & { reply?: string };
    if (typeof data.reply !== 'string' || !data.reply.trim()) return fallback;

    return {
      reply: sanitizeConciergeReply(data.reply, fallback.reply),
      source: data.source === 'openai' ? 'openai' : 'local',
      lang: data.lang ?? fallback.lang,
      isLocalQuery: data.isLocalQuery ?? fallback.isLocalQuery,
      recommendations: (Array.isArray(data.recommendations) ? data.recommendations : fallback.recommendations).slice(
        0,
        settings.maxResults,
      ),
      heritage: Array.isArray(data.heritage) ? data.heritage : fallback.heritage,
      posts: fallback.posts,
      antiqueItems: Array.isArray(data.antiqueItems) ? data.antiqueItems : fallback.antiqueItems,
      basket: data.basket ?? fallback.basket,
      checklist: Array.isArray(data.checklist) ? data.checklist : fallback.checklist,
      persona: data.persona === 'chineur' || fallback.persona === 'chineur' ? 'chineur' : 'default',
    };
  } catch {
    return fallback;
  }
}
