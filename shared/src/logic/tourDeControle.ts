import { LocalRelaisRetraitStatus } from '../types/enums.js';
import type {
  ActeurLocal,
  CarteFideliteScan,
  LocalRelais,
  PostAnnonce,
  PrivilegeConsommation,
  User,
} from '../types/models.js';
import { isVipUnlocked } from './fidelite.js';

export interface PrivilegeOfferStat {
  commerceId: string;
  commerceNom: string;
  offreVip: string;
  debloques: number;
  consommes: number;
}

export interface CommerceActivite {
  commerceId: string;
  commerceNom: string;
  credits: number;
  points: number;
}

export interface TourDeControleStats {
  pointsDistribues: number;
  creditsEnregistres: number;
  pointsViaCredits: number;
  privilegesDebloques: number;
  privilegesConsommes: number;
  privilegeOffres: PrivilegeOfferStat[];
  commercesActifs: CommerceActivite[];
  annonces: number;
  relaisTotal: number;
  relaisEnCours: number;
  relaisRecuperes: number;
}

export function computeTourDeControle(data: {
  users: User[];
  posts: PostAnnonce[];
  relais: LocalRelais[];
  acteurs: ActeurLocal[];
  scans: CarteFideliteScan[];
  consommations: PrivilegeConsommation[];
}): TourDeControleStats {
  const vipShops = data.acteurs.filter((acteur) => Boolean(acteur.offreVip));
  const privilegeOffres: PrivilegeOfferStat[] = vipShops.map((acteur) => {
    const debloques = data.users.filter((user) => isVipUnlocked(user.pointsFidelite, acteur)).length;
    const consommes = data.consommations.filter((item) => item.commerceId === acteur.id).length;
    return {
      commerceId: acteur.id,
      commerceNom: acteur.nomCommerce,
      offreVip: acteur.offreVip ?? '',
      debloques,
      consommes,
    };
  });

  const activity = new Map<string, CommerceActivite>();
  for (const acteur of data.acteurs) {
    activity.set(acteur.id, {
      commerceId: acteur.id,
      commerceNom: acteur.nomCommerce,
      credits: 0,
      points: 0,
    });
  }
  for (const scan of data.scans) {
    const current = activity.get(scan.commerceId);
    if (!current) continue;
    current.credits += 1;
    current.points += scan.pointsGagnes;
  }

  const commercesActifs = [...activity.values()]
    .filter((item) => item.credits > 0 || item.points > 0)
    .sort((a, b) => b.points - a.points || b.credits - a.credits)
    .slice(0, 8);

  const relaisRecuperes = data.relais.filter(
    (item) => item.statutRetrait === LocalRelaisRetraitStatus.Recupere,
  ).length;

  return {
    pointsDistribues: data.users.reduce((sum, user) => sum + (user.pointsFidelite || 0), 0),
    creditsEnregistres: data.scans.length,
    pointsViaCredits: data.scans.reduce((sum, scan) => sum + scan.pointsGagnes, 0),
    privilegesDebloques: privilegeOffres.reduce((sum, item) => sum + item.debloques, 0),
    privilegesConsommes: data.consommations.length,
    privilegeOffres: privilegeOffres.sort((a, b) => b.consommes - a.consommes || b.debloques - a.debloques),
    commercesActifs,
    annonces: data.posts.length,
    relaisTotal: data.relais.length,
    relaisEnCours: data.relais.length - relaisRecuperes,
    relaisRecuperes,
  };
}
