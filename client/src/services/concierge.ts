import {
  conciergePhrasebookLang,
  detectConciergeLang,
  runConciergeEngine,
  type ConciergeLang,
  type ConciergeRecommendation,
  type LocalBasket,
  type PostAnnonce,
  type StreetHeritage,
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
  basket: LocalBasket | null;
  checklist: string[];
}

export interface AskConciergeInput {
  message: string;
  history: ConciergeTurn[];
  lang: ConciergeLangChoice;
  uiLang: string;
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
  source: ConciergeSource,
  reply?: string,
): ConciergeAnswer {
  const lang = resolveLang(input.lang, input.message, input.uiLang);
  const engine = runConciergeEngine({
    message: input.message,
    history: input.history.map((turn) => ({ role: turn.role, content: turn.content })),
    previousRecommendations: lastRecommendations(input.history),
    posts,
    lang,
    maxResults: loadConciergeSettings().maxResults,
  });
  return {
    reply: reply?.trim() || engine.reply,
    source,
    lang,
    isLocalQuery: engine.analysis.isLocal,
    recommendations: engine.recommendations,
    heritage: engine.heritage,
    posts: engine.posts,
    basket: engine.basket,
    checklist: engine.checklist,
  };
}

/** Moteur multi-sources 100 % local (POI + annonces + recettes). */
export function localConciergeAnswer(input: AskConciergeInput, posts: PostAnnonce[] = []): ConciergeAnswer {
  return engineToAnswer(input, posts, 'local');
}

async function loadPosts(): Promise<PostAnnonce[]> {
  try {
    return await api.getPosts();
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
  const posts = await loadPosts();
  const answer = await requestConcierge(input, settings, posts);
  recordConciergeUsage(answer);
  return answer;
}

async function requestConcierge(
  input: AskConciergeInput,
  settings: ConciergeSettings,
  posts: PostAnnonce[],
): Promise<ConciergeAnswer> {
  const fallback = localConciergeAnswer(input, posts);
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
    if (!response.ok) return fallback;

    const data = (await response.json()) as Partial<ConciergeAnswer> & { reply?: string };
    if (typeof data.reply !== 'string' || !data.reply.trim()) return fallback;

    return {
      reply: data.reply,
      source: data.source === 'openai' ? 'openai' : 'local',
      lang: data.lang ?? fallback.lang,
      isLocalQuery: data.isLocalQuery ?? fallback.isLocalQuery,
      recommendations: (Array.isArray(data.recommendations) ? data.recommendations : fallback.recommendations).slice(
        0,
        settings.maxResults,
      ),
      heritage: Array.isArray(data.heritage) ? data.heritage : fallback.heritage,
      posts: Array.isArray(data.posts) ? data.posts : fallback.posts,
      basket: data.basket ?? fallback.basket,
      checklist: Array.isArray(data.checklist) ? data.checklist : fallback.checklist,
    };
  } catch {
    return fallback;
  }
}
