import { UserRole, type PostAnnonce, type User } from '@idea-chartrons/shared';

export const DEMO_SPONSORED_POST_ID = 'post-5';

export function getSponsoredPostId(posts: PostAnnonce[], users: User[]): string | null {
  if (posts.some((post) => post.id === DEMO_SPONSORED_POST_ID)) {
    return DEMO_SPONSORED_POST_ID;
  }
  const merchantIds = new Set(
    users.filter((user) => user.role === UserRole.Commercant).map((user) => user.id),
  );
  const merchantPosts = posts
    .filter((post) => merchantIds.has(post.auteurId) && post.type === 'Vente')
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  return merchantPosts[0]?.id ?? null;
}

export function pinSponsoredPost(posts: PostAnnonce[], sponsoredId: string | null): PostAnnonce[] {
  if (!sponsoredId) return posts;
  const featured = posts.filter((post) => post.id === sponsoredId);
  const rest = posts.filter((post) => post.id !== sponsoredId);
  return [...featured, ...rest];
}
