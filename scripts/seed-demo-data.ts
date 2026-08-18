#!/usr/bin/env npx tsx
/**
 * Injecte le catalogue de commerces de démonstration (Chartrons) dans le seed applicatif.
 *
 * Il n’y a pas de base SQL : l’annuaire vit dans `@idea-chartrons/shared` + localStorage.
 * Ce script :
 *  1. Vérifie l’hygiène (`isDemo: true` sur chaque fiche).
 *  2. Force `INCLUDE_DEMO_DATA=true` et construit le seed (acteurs + posts liés).
 *  3. Journalise les volumes (Premium, livraison, sandwichs) pour le concierge.
 *
 * Usage : npm run seed:demo
 */
process.env.INCLUDE_DEMO_DATA = process.env.INCLUDE_DEMO_DATA || 'true';

async function main(): Promise<void> {
  const { assertDemoCatalogReady, DEMO_CHARTRONS_POIS } = await import('../shared/src/data/demoMerchants.ts');
  const { createSeedData, includeDemoData, isDemoRecord, wipeDemoFromSchema } = await import('../shared/src/index.ts');

  const summary = assertDemoCatalogReady(DEMO_CHARTRONS_POIS);
  const seed = createSeedData();
  const demoActeurs = seed.acteursLocaux.filter(isDemoRecord);
  const demoPosts = seed.postsAnnonces.filter(isDemoRecord);
  const premium = demoActeurs.filter((acteur) => acteur.tier === 'premium_pro' || acteur.isVip).length;
  const delivery = demoActeurs.filter((acteur) => acteur.hasDelivery).length;
  const sandwich = demoActeurs.filter((acteur) =>
    `${acteur.nomCommerce} ${acteur.specialite} ${acteur.description}`.toLowerCase().includes('sandwich'),
  ).length;

  console.log('[seed-demo-data] INCLUDE_DEMO_DATA =', includeDemoData());
  console.log('[seed-demo-data] catalog', summary);
  console.log('[seed-demo-data] injected acteurs', {
    count: demoActeurs.length,
    premium,
    delivery,
    sandwich,
    ids: demoActeurs.map((acteur) => acteur.id),
  });
  console.log('[seed-demo-data] injected posts', {
    count: demoPosts.length,
    ids: demoPosts.map((post) => post.id),
  });

  const rehearsal = wipeDemoFromSchema(seed);
  console.log('[seed-demo-data] wipe rehearsal (in-memory only)', rehearsal.report);
  if (rehearsal.data.acteursLocaux.some(isDemoRecord) || rehearsal.data.postsAnnonces.some(isDemoRecord)) {
    throw new Error('Wipe rehearsal left isDemo records behind.');
  }

  console.log(
    '[seed-demo-data] done. Open the PWA (dev or VITE_INCLUDE_DEMO_DATA=true) to persist these records in localStorage.',
  );
}

void main().catch((error: unknown) => {
  console.error('[seed-demo-data] failed', error);
  process.exit(1);
});
