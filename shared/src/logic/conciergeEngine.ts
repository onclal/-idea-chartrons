import { PostStatus } from '../types/enums.js';
import type { PostAnnonce } from '../types/models.js';
import { matchesSearchQuery } from './search.js';
import {
  analyzeConciergeQuery,
  buildConciergeContext,
  buildConciergeSystemPrompt,
  buildLocalConciergeReply,
  heritageForQuery,
  normalizeConciergeText,
  rankConciergeMatches,
  type ConciergeHistoryTurn,
  type ConciergeLang,
  type ConciergeQueryAnalysis,
  type ConciergeRecommendation,
} from './concierge.js';
import { basketChecklist, buildLocalBasket, isRecipeQueryText, type LocalBasket } from './conciergeRecipes.js';
import type { StreetHeritage } from '../data/chartronsHeritage.js';

export interface ConciergeEngineInput {
  message: string;
  history?: ConciergeHistoryTurn[];
  previousRecommendations?: ConciergeRecommendation[];
  posts?: PostAnnonce[];
  lang: ConciergeLang;
  now?: Date;
  maxResults?: number;
}

export interface ConciergeEngineResult {
  analysis: ConciergeQueryAnalysis;
  recommendations: ConciergeRecommendation[];
  heritage: StreetHeritage[];
  posts: PostAnnonce[];
  basket: LocalBasket | null;
  checklist: string[];
  reply: string;
  context: string;
  systemPrompt: string;
}

const POST_TYPE_HINTS: Record<string, string[]> = {
  Don: ['don', 'donation', 'giveaway', 'poussette', 'landau', 'bebe', 'bébé', 'baby', 'livres', 'livre'],
  Vente: ['vente', 'vends', 'sale', 'acheter', 'brocante', 'vintage'],
  Service_Aide: ['entraide', 'aide', 'bricolage', 'garde', 'nounou', 'baby-sitting', 'babysitting', 'babysit'],
  Petit_Boulot: ['boulot', 'job', 'jardin', 'jardinage', 'plantes', 'arrosage', 'gardening'],
  Offre_Pro: ['offre pro', 'pro', 'prestation'],
};

export function rankConciergePosts(posts: PostAnnonce[], analysis: ConciergeQueryAnalysis, limit = 5): PostAnnonce[] {
  const available = posts.filter((post) => post.statut === PostStatus.Disponible || post.statut === PostStatus.DepotLocal);
  const hay = analysis.normalized || normalizeConciergeText(analysis.raw);
  const scored = available
    .map((post) => {
      let score = 0;
      if (matchesSearchQuery(post.titre, analysis.memoryQuery) || matchesSearchQuery(post.titre, analysis.raw)) score += 20;
      if (matchesSearchQuery(post.description, analysis.memoryQuery) || matchesSearchQuery(post.description, analysis.raw)) {
        score += 12;
      }
      const typeHints = POST_TYPE_HINTS[post.type] ?? [];
      if (typeHints.some((hint) => hay.includes(normalizeConciergeText(hint)))) score += 16;
      for (const token of analysis.tokens) {
        if (token.length < 3) continue;
        const blob = normalizeConciergeText(`${post.titre} ${post.description}`);
        if (blob.includes(token)) score += 6;
      }
      return { post, score };
    })
    .filter((entry) => entry.score >= 12)
    .sort((a, b) => b.score - a.score);

  return scored.slice(0, limit).map((entry) => entry.post);
}

function basketToContext(basket: LocalBasket, lang: ConciergeLang): string {
  const fr = lang === 'fr';
  const stops = basket.stops
    .map((stop, index) => {
      const items = stop.lines.map((line) => `${line.name} ${line.price.toFixed(2)}€`).join(', ');
      return `${index + 1}. ${stop.name} (${stop.address}) : ${items} = ${stop.subtotal.toFixed(2)}€`;
    })
    .join('\n');
  return [
    `${basket.title} — ${basket.summary}`,
    fr ? 'Parcours d’achat :' : 'Buying route:',
    stops,
    basket.unmatched.length ? `Manquant : ${basket.unmatched.join(', ')}` : '',
    `Total estimé : ${basket.totalEstimate.toFixed(2)} €`,
    basket.steps,
  ]
    .filter(Boolean)
    .join('\n');
}

export function runConciergeEngine(input: ConciergeEngineInput): ConciergeEngineResult {
  const now = input.now ?? new Date();
  const analysis = analyzeConciergeQuery(input.message, input.history);
  const recipeQuery = analysis.askedRecipe || isRecipeQueryText(input.message);
  const basket = recipeQuery ? buildLocalBasket(analysis.memoryQuery || input.message, input.lang === 'en' ? 'en' : 'fr') : null;

  let recommendations = rankConciergeMatches(analysis, input.maxResults, now);
  if (analysis.followUp && input.previousRecommendations?.length) {
    const remembered = input.previousRecommendations;
    recommendations =
      analysis.focusOrdinal && remembered[analysis.focusOrdinal - 1]
        ? [remembered[analysis.focusOrdinal - 1]]
        : remembered;
  }

  if (basket && recommendations.length === 0) {
    recommendations = basket.stops.slice(0, input.maxResults ?? 5).map((stop) => {
      const match = rankConciergeMatches(
        analyzeConciergeQuery(stop.name),
        1,
        now,
      )[0];
      return match;
    }).filter((item): item is ConciergeRecommendation => Boolean(item));
  }

  const posts = rankConciergePosts(input.posts ?? [], analysis);

  const heritage = heritageForQuery(analysis);
  const context = buildConciergeContext(analysis, {
    posts,
    previousRecommendations: analysis.followUp ? recommendations : undefined,
    basketSummary: basket ? basketToContext(basket, input.lang) : undefined,
  });
  const reply = buildLocalConciergeReply(analysis, recommendations, input.lang, { posts, basket });

  return {
    analysis,
    recommendations,
    heritage,
    posts,
    basket,
    checklist: basket ? basketChecklist(basket) : [],
    reply,
    context,
    systemPrompt: buildConciergeSystemPrompt(),
  };
}
