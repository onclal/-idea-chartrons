import type { PostAnnonce } from '@idea-chartrons/shared';

export const DEMO_SPONSORED_POST_ID = 'post-5';

/**
 * Mise en avant sponsorisée : en mode invité il n'existe plus de rôle « commerçant »,
 * la sélection repose donc sur l'annonce sponsorisée déclarée puis, à défaut, sur la
 * vente la plus récente.
 */
export function getSponsoredPostId(posts: PostAnnonce[]): string | null {
  if (posts.some((post) => post.id === DEMO_SPONSORED_POST_ID)) {
    return DEMO_SPONSORED_POST_ID;
  }
  const ventes = posts
    .filter((post) => post.type === 'Vente')
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  return ventes[0]?.id ?? null;
}

export function pinSponsoredPost(posts: PostAnnonce[], sponsoredId: string | null): PostAnnonce[] {
  if (!sponsoredId) return posts;
  const featured = posts.filter((post) => post.id === sponsoredId);
  const rest = posts.filter((post) => post.id !== sponsoredId);
  return [...featured, ...rest];
}
