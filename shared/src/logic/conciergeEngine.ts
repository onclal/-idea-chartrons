import { PostStatus } from '../types/enums.js';
import type { PostAnnonce } from '../types/models.js';
import { isActiveAntiGaspiOffer, isResidentFeedPost } from './antiGaspi.js';
import {
  analyzeConciergeQuery,
  buildConciergeContext,
  buildConciergeSystemPrompt,
  buildLocalConciergeReply,
  CONCIERGE_SPOKEN_RESULTS,
  heritageForQuery,
  normalizeConciergeText,
  rankConciergeMatches,
  sanitizeConciergeReply,
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
  Anti_Gaspi: [
    'gaspi',
    'anti-gaspi',
    'antigaspi',
    'gaspillage',
    'invendu',
    'surplus',
    'anti-waste',
    'unsold',
  ],
};

const GENERIC_POST_TOKENS = new Set([
  'acheter',
  'achet',
  'buy',
  'buying',
  'vendre',
  'vends',
  'vente',
  'sale',
  'sold',
  'donner',
  'donne',
  'don',
  'giveaway',
  'gratuit',
  'free',
  'cherche',
  'chercher',
  'looking',
  'want',
  'need',
  'besoin',
  'veux',
  'voudrais',
  'trouver',
  'find',
  'peux',
  'pouvez',
  'peut',
  'annonce',
  'annonces',
  'post',
  'listing',
  'quartier',
  'chartrons',
  'bordeaux',
]);

function distinctivePostTokens(analysis: ConciergeQueryAnalysis): string[] {
  return analysis.tokens.filter((token) => token.length >= 4 && !GENERIC_POST_TOKENS.has(token));
}

const COMMERCE_INTENT_IDS = new Set([
  'restaurant',
  'fastfood',
  'bar',
  'cafe',
  'bakery',
  'pastry',
  'wine',
  'grocery',
  'butcher',
  'cheese',
  'pharmacy',
  'health',
  'beauty',
  'hair',
]);

export function rankConciergePosts(
  posts: PostAnnonce[],
  analysis: ConciergeQueryAnalysis,
  limit = CONCIERGE_SPOKEN_RESULTS,
  now = Date.now(),
): PostAnnonce[] {
  const cap = Math.max(1, Math.min(limit, CONCIERGE_SPOKEN_RESULTS));

  if (analysis.askedAntiGaspi) {
    const active = posts.filter((post) => isActiveAntiGaspiOffer(post, now));
    const hay = analysis.normalized || normalizeConciergeText(analysis.raw);
    const distinctive = distinctivePostTokens(analysis);
    if (distinctive.length === 0) return active.slice(0, cap);
    const scored = active
      .map((post) => {
        const blob = normalizeConciergeText(
          `${post.titre} ${post.description} ${post.commerceNom ?? ''} ${post.auteurNom ?? ''}`,
        );
        let score = 8;
        for (const token of distinctive) {
          if (blob.includes(token)) score += 20;
        }
        if (hay && blob) score += 4;
        return { post, score };
      })
      .sort((a, b) => b.score - a.score);
    return scored.slice(0, cap).map((entry) => entry.post);
  }

  const available = posts.filter(
    (post) =>
      isResidentFeedPost(post) &&
      (post.statut === PostStatus.Disponible || post.statut === PostStatus.DepotLocal),
  );
  const hay = analysis.normalized || normalizeConciergeText(analysis.raw);
  const distinctive = distinctivePostTokens(analysis);

  if (!analysis.askedPosts && analysis.intentIds.some((id) => COMMERCE_INTENT_IDS.has(id))) {
    return [];
  }
  if (!analysis.askedPosts && distinctive.length === 0) return [];
  if (analysis.askedPosts && distinctive.length === 0) {
    return available.slice(0, cap);
  }

  const scored = available
    .map((post) => {
      const blob = normalizeConciergeText(`${post.titre} ${post.description}`);
      let score = 0;
      for (const token of distinctive) {
        if (blob.includes(token)) score += 20;
      }
      const typeHints = (POST_TYPE_HINTS[post.type] ?? [])
        .map((hint) => normalizeConciergeText(hint))
        .filter((hint) => hint.length >= 4 && !GENERIC_POST_TOKENS.has(hint));
      if (typeHints.some((hint) => hay.includes(hint) && blob.includes(hint))) score += 16;
      return { post, score };
    })
    .filter((entry) => entry.score >= 20)
    .sort((a, b) => b.score - a.score);

  return scored.slice(0, cap).map((entry) => entry.post);
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

  const posts = rankConciergePosts(
    input.posts ?? [],
    analysis,
    CONCIERGE_SPOKEN_RESULTS,
    now.getTime(),
  );
  const heritage = analysis.askedHistory || analysis.streets.length > 0 ? heritageForQuery(analysis) : [];
  const context = buildConciergeContext(analysis, {
    posts: posts.length > 0 ? posts : undefined,
    previousRecommendations: analysis.followUp ? recommendations : undefined,
    basketSummary: basket ? basketToContext(basket, input.lang) : undefined,
  });
  const rawReply = buildLocalConciergeReply(analysis, recommendations, input.lang, {
    posts: posts.length > 0 ? posts : undefined,
    basket,
  });

  return {
    analysis,
    recommendations,
    heritage,
    posts,
    basket,
    checklist: basket ? basketChecklist(basket) : [],
    reply: sanitizeConciergeReply(rawReply, rawReply),
    context,
    systemPrompt: buildConciergeSystemPrompt(),
  };
}
