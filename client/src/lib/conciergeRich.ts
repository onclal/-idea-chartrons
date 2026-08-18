import type { ConciergeRecommendation, PostAnnonce } from '@idea-chartrons/shared';
import { matchesSearchQuery } from '@idea-chartrons/shared';

const RECIPE_HINTS = [
  'recette',
  'recipe',
  'ingredient',
  'ingredients',
  'cuisine',
  'canel',
  'gateau',
  'preparer',
  'cook',
  'cooking',
];

const POST_HINTS = ['don', 'annonce', 'entraide', 'boulot', 'vente', 'giveaway', 'job', 'mutual'];

export function isRecipeQuery(query: string): boolean {
  const hay = query.toLowerCase();
  return RECIPE_HINTS.some((hint) => hay.includes(hint));
}

export function isPostQuery(query: string): boolean {
  const hay = query.toLowerCase();
  return POST_HINTS.some((hint) => hay.includes(hint));
}

/** Extrait une checklist (recette, courses) depuis la réponse du concierge. */
export function extractChecklist(reply: string): string[] {
  const items: string[] = [];
  for (const raw of reply.split('\n')) {
    const line = raw.trim();
    const match = line.match(/^(?:[-*•]|[\d]+[.)])\s+(.+)$/);
    if (!match) continue;
    const text = match[1].replace(/\s+/g, ' ').trim();
    if (text.length >= 3 && text.length <= 90) items.push(text);
  }
  return [...new Set(items)].slice(0, 12);
}

export function filterMatchingPosts(posts: PostAnnonce[], query: string): PostAnnonce[] {
  if (!query.trim()) return [];
  return posts
    .filter(
      (post) =>
        matchesSearchQuery(post.titre, query) ||
        matchesSearchQuery(post.description, query) ||
        matchesSearchQuery(post.type, query),
    )
    .slice(0, 4);
}

export function hasRichConciergeContent(input: {
  recommendations: ConciergeRecommendation[];
  heritageCount: number;
  checklist: string[];
  posts: PostAnnonce[];
}): boolean {
  return (
    input.recommendations.length > 0 ||
    input.heritageCount > 0 ||
    input.checklist.length > 0 ||
    input.posts.length > 0
  );
}
