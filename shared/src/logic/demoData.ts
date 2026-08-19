import { DEMO_CHARTRONS_POIS } from '../data/demoMerchants.js';
import { chartronsPoiToActeur } from '../data/chartronsPois.js';
import { hydrateChartronsPoi } from './poi.js';
import { isDemoRecord } from './demoEnv.js';
import type { ActeurLocal, DatabaseSchema, PostAnnonce } from '../types/models.js';

export interface DemoWipeReport {
  acteurs: number;
  posts: number;
}

export function createDemoActeurs(now: string): ActeurLocal[] {
  return DEMO_CHARTRONS_POIS.map((poi) => chartronsPoiToActeur(hydrateChartronsPoi(poi), now));
}

/**
 * Équivalent applicatif de `DELETE FROM businesses WHERE is_demo = true`
 * (et des annonces liées). Aucune table SQL : l’annuaire vit dans le schéma mémoire / localStorage.
 */
export function wipeDemoFromSchema(data: DatabaseSchema): { data: DatabaseSchema; report: DemoWipeReport } {
  const demoActeurIds = new Set(data.acteursLocaux.filter(isDemoRecord).map((acteur) => acteur.id));
  const acteursLocaux = data.acteursLocaux.filter((acteur) => !isDemoRecord(acteur));
  const postsAnnonces = data.postsAnnonces.filter(
    (post) => !isDemoRecord(post) && !demoActeurIds.has(post.acteurId ?? ''),
  );
  const antiqueItems = (data.antiqueItems ?? []).filter((item) => !demoActeurIds.has(item.merchantId));
  return {
    data: {
      ...data,
      acteursLocaux,
      postsAnnonces,
      antiqueItems,
    },
    report: {
      acteurs: data.acteursLocaux.length - acteursLocaux.length,
      posts: data.postsAnnonces.length - postsAnnonces.length,
    },
  };
}

export function mergeMissingDemoActeurs(existing: ActeurLocal[], now: string): { acteurs: ActeurLocal[]; added: number } {
  const known = new Set(existing.map((acteur) => acteur.id));
  const added: ActeurLocal[] = [];
  for (const demo of createDemoActeurs(now)) {
    if (!known.has(demo.id)) {
      added.push(demo);
      known.add(demo.id);
    }
  }
  return { acteurs: added.length ? [...existing, ...added] : existing, added: added.length };
}

export function mergeMissingDemoPosts(existing: PostAnnonce[], extras: PostAnnonce[]): { posts: PostAnnonce[]; added: number } {
  const known = new Set(existing.map((post) => post.id));
  const added: PostAnnonce[] = [];
  for (const post of extras) {
    if (!known.has(post.id)) {
      added.push(post);
      known.add(post.id);
    }
  }
  return { posts: added.length ? [...existing, ...added] : existing, added: added.length };
}
