import { PostStatus } from '../types/enums.js';
import type { ActeurLocal, AntiqueItem, PostAnnonce } from '../types/models.js';
import { isActiveAntiGaspiOffer, isResidentFeedPost } from './antiGaspi.js';
import {
  analyzeConciergeQuery,
  buildChineurReply,
  buildChineurSystemPrompt,
  buildConciergeContext,
  buildConciergeSystemPrompt,
  buildLocalConciergeReply,
  conciergePoiPool,
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
import type { GeoCoordinates, GeoOriginSource } from './geo.js';
import {
  matchingPepitesForPoi,
  mergeAntiquePoiPool,
  pepiteScoreForPoi,
  publicPepites,
  searchAntiqueItems,
} from './antiques.js';

export type ConciergePersona = 'default' | 'chineur';

export interface ConciergeEngineInput {
  message: string;
  history?: ConciergeHistoryTurn[];
  previousRecommendations?: ConciergeRecommendation[];
  posts?: PostAnnonce[];
  antiqueItems?: AntiqueItem[];
  acteurs?: ActeurLocal[];
  persona?: ConciergePersona;
  lang: ConciergeLang;
  now?: Date;
  maxResults?: number;
  origin?: GeoCoordinates | null;
  originSource?: GeoOriginSource;
}

export interface ConciergeEngineResult {
  analysis: ConciergeQueryAnalysis;
  recommendations: ConciergeRecommendation[];
  heritage: StreetHeritage[];
  posts: PostAnnonce[];
  antiqueItems: AntiqueItem[];
  basket: LocalBasket | null;
  checklist: string[];
  reply: string;
  context: string;
  systemPrompt: string;
  persona: ConciergePersona;
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
  const geo = { origin: input.origin, originSource: input.originSource };
  const persona: ConciergePersona = input.persona === 'chineur' ? 'chineur' : 'default';
  const analysis = analyzeConciergeQuery(input.message, input.history, geo);
  const chineurAnalysis: ConciergeQueryAnalysis =
    persona === 'chineur'
      ? {
          ...analysis,
          isLocal: true,
          intentIds: analysis.intentIds.includes('antiques')
            ? analysis.intentIds
            : ['antiques', ...analysis.intentIds],
        }
      : analysis;

  const recipeQuery = analysis.askedRecipe || isRecipeQueryText(input.message);
  const basket =
    persona === 'chineur'
      ? null
      : recipeQuery
        ? buildLocalBasket(analysis.memoryQuery || input.message, input.lang === 'en' ? 'en' : 'fr')
        : null;

  const showcase = publicPepites(input.antiqueItems ?? [], input.acteurs ?? []);
  const matchedPepites =
    persona === 'chineur' ? searchAntiqueItems(input.message, showcase) : [];

  const antiquePool = persona === 'chineur' ? mergeAntiquePoiPool(conciergePoiPool(), input.acteurs) : [];
  let recommendations = rankConciergeMatches(
    chineurAnalysis,
    input.maxResults,
    now,
    persona === 'chineur'
      ? {
          poiPool: antiquePool,
          extraScore: (poi) => pepiteScoreForPoi(poi, showcase, input.message),
        }
      : undefined,
  );
  if (analysis.followUp && !analysis.askedExpandRadius && input.previousRecommendations?.length) {
    const remembered = input.previousRecommendations;
    recommendations =
      analysis.focusOrdinal && remembered[analysis.focusOrdinal - 1]
        ? [remembered[analysis.focusOrdinal - 1]]
        : remembered;
  }

  if (basket && recommendations.length === 0) {
    recommendations = basket.stops.slice(0, input.maxResults ?? 5).map((stop) => {
      const match = rankConciergeMatches(
        analyzeConciergeQuery(stop.name, undefined, geo),
        1,
        now,
      )[0];
      return match;
    }).filter((item): item is ConciergeRecommendation => Boolean(item));
  }

  const posts =
    persona === 'chineur'
      ? []
      : rankConciergePosts(
          input.posts ?? [],
          analysis,
          CONCIERGE_SPOKEN_RESULTS,
          now.getTime(),
        );
  const antiqueItems =
    persona === 'chineur'
      ? (() => {
          const fromQuery = matchedPepites.length > 0 ? matchedPepites : [];
          const fromShops =
            fromQuery.length > 0
              ? fromQuery
              : recommendations.flatMap((rec) => {
                  const poi = antiquePool.find((entry) => entry.id === rec.poiId);
                  return poi ? matchingPepitesForPoi(poi, showcase, input.message) : [];
                });
          const seen = new Set<string>();
          return fromShops.filter((item) => {
            if (seen.has(item.id)) return false;
            seen.add(item.id);
            return true;
          }).slice(0, CONCIERGE_SPOKEN_RESULTS);
        })()
      : [];
  const heritage = analysis.askedHistory || analysis.streets.length > 0 ? heritageForQuery(analysis) : [];
  const pepiteNotes =
    antiqueItems.length > 0
      ? [
          'Pépites encore en vitrine (seconde source autorisée) :',
          ...antiqueItems.map(
            (item) =>
              `- ${item.title} (${item.style}, ${item.era}) — boutique ${item.merchantId}. ${item.description}`,
          ),
        ].join('\n')
      : undefined;
  const context = buildConciergeContext(chineurAnalysis, {
    posts: posts.length > 0 ? posts : undefined,
    previousRecommendations: analysis.followUp ? recommendations : undefined,
    basketSummary: basket
      ? basketToContext(basket, input.lang)
      : pepiteNotes,
  });
  const rawReply =
    persona === 'chineur'
      ? buildChineurReply(chineurAnalysis, recommendations, antiqueItems, input.lang)
      : buildLocalConciergeReply(analysis, recommendations, input.lang, {
          posts: posts.length > 0 ? posts : undefined,
          basket,
          antiqueItems,
        });

  return {
    analysis: chineurAnalysis,
    recommendations,
    heritage,
    posts,
    antiqueItems,
    basket,
    checklist: basket ? basketChecklist(basket) : [],
    reply: sanitizeConciergeReply(rawReply, rawReply),
    context,
    systemPrompt: persona === 'chineur' ? buildChineurSystemPrompt() : buildConciergeSystemPrompt(),
    persona,
  };
}
