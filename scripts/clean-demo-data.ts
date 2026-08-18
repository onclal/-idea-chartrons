#!/usr/bin/env npx tsx
/**
 * Wipe ciblé des enregistrements de démonstration.
 *
 * Équivalent applicatif de :
 *   DELETE FROM businesses WHERE is_demo = true;
 * (plus les annonces liées aux acteurs démo.)
 *
 * Usage : npm run clean:demo
 *
 * Le navigateur conserve encore une copie localStorage : le panneau admin
 * « Purger les fiches démo » exécute la même fonction côté client.
 */
process.env.INCLUDE_DEMO_DATA = process.env.INCLUDE_DEMO_DATA || 'true';

async function main(): Promise<void> {
  const { createSeedData, wipeDemoFromSchema, isDemoRecord } = await import('../shared/src/index.ts');

  const seed = createSeedData();
  const beforeActeurs = seed.acteursLocaux.filter(isDemoRecord).length;
  const beforePosts = seed.postsAnnonces.filter(isDemoRecord).length;
  const { report, data } = wipeDemoFromSchema(seed);
  const leftoverActeurs = data.acteursLocaux.filter(isDemoRecord).length;
  const leftoverPosts = data.postsAnnonces.filter(isDemoRecord).length;

  console.log('[clean-demo-data] before', { acteurs: beforeActeurs, posts: beforePosts });
  console.log('[clean-demo-data] removed', report);
  console.log('[clean-demo-data] leftover is_demo (must be 0)', {
    acteurs: leftoverActeurs,
    posts: leftoverPosts,
  });

  if (leftoverActeurs > 0 || leftoverPosts > 0) {
    console.error('[clean-demo-data] hygiene failed: demo records remain after wipe.');
    process.exit(1);
  }

  console.log(
    `[clean-demo-data] safely removed ${report.acteurs} merchant(s) and ${report.posts} related post(s).`,
  );
}

void main().catch((error: unknown) => {
  console.error('[clean-demo-data] failed', error);
  process.exit(1);
});
