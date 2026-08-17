import {
  CIVIC_SUBCATEGORIES,
  REPORT_SUBCATEGORY_LABELS,
  SAFETY_SUBCATEGORIES,
  type ReportSubcategoryId,
} from '@idea-chartrons/shared';
import type { LocaleText } from '../lib/locale';

export type CivicChannelId = 'mairie' | 'police';

export interface CivicChannel {
  id: CivicChannelId;
  icon: string;
  title: LocaleText;
  kicker: LocaleText;
  hint: LocaleText;
  phone: string;
  phoneLabel: LocaleText;
  href: string;
  hrefLabel: LocaleText;
  note: LocaleText;
}

export interface CivicReportCategory {
  /** Sous-catégorie unifiée : même vocabulaire que l'admin et le concierge IA. */
  id: ReportSubcategoryId;
  icon: string;
  channel: CivicChannelId;
  label: LocaleText;
  hint: LocaleText;
  /** Gabarit de signalement, pré-rempli avec l’adresse saisie par l’habitant. */
  template: LocaleText;
}

/** Numéro unique des services de la Ville de Bordeaux (Allô Mairie). */
export const ALLO_MAIRIE_PHONE = '05 56 10 20 30';
export const BORDEAUX_CITY_URL = 'https://www.bordeaux.fr';
export const BORDEAUX_METROPOLE_WASTE_URL = 'https://www.bordeaux-metropole.fr/vie-quotidienne/dechets';

export const CIVIC_CHANNELS: CivicChannel[] = [
  {
    id: 'mairie',
    icon: '🏛️',
    kicker: { fr: 'Voirie · Propreté · Cadre de vie', en: 'Roads · Cleanliness · Living space' },
    title: { fr: 'Signalement Mairie / Voirie', en: 'Report to the City / Roads dept.' },
    hint: {
      fr: 'Dépôt sauvage, tag, nid-de-poule, éclairage en panne, arbre à élaguer, trottoir infranchissable : le service Allô Mairie centralise les demandes du quartier.',
      en: 'Illegal dumping, graffiti, potholes, broken street lighting, trees to prune, impassable pavements: the Allô Mairie service centralises neighborhood requests.',
    },
    phone: ALLO_MAIRIE_PHONE,
    phoneLabel: { fr: 'Allô Mairie', en: 'Allô Mairie' },
    href: BORDEAUX_CITY_URL,
    hrefLabel: { fr: 'Ouvrir bordeaux.fr', en: 'Open bordeaux.fr' },
    note: {
      fr: 'Les encombrants se prennent sur rendez-vous auprès de Bordeaux Métropole : ne les déposez jamais sur le trottoir.',
      en: 'Bulky waste is collected by appointment with Bordeaux Métropole: never leave it on the pavement.',
    },
  },
  {
    id: 'police',
    icon: '🛡️',
    kicker: { fr: 'Tranquillité publique', en: 'Public order' },
    title: { fr: 'Police Municipale / Tranquillité', en: 'Municipal Police / Public order' },
    hint: {
      fr: 'Bruit répété, occupation abusive de l’espace public, stationnement gênant : la Police Municipale intervient sur les troubles non urgents du quartier.',
      en: 'Repeated noise, misuse of public space, obstructive parking: the Municipal Police handle non-urgent neighborhood issues.',
    },
    phone: ALLO_MAIRIE_PHONE,
    phoneLabel: { fr: 'Police Municipale via Allô Mairie', en: 'Municipal Police via Allô Mairie' },
    href: BORDEAUX_CITY_URL,
    hrefLabel: { fr: 'Démarches Ville de Bordeaux', en: 'City of Bordeaux services' },
    note: {
      fr: 'Danger immédiat, agression, cambriolage en cours : appelez le 17 (Police Secours) ou le 112, pas la Police Municipale.',
      en: 'Immediate danger, assault or burglary in progress: call 17 (Police emergency) or 112, not the Municipal Police.',
    },
  },
];

const REPORT_ICONS: Record<ReportSubcategoryId, string> = {
  voirie_proprete: '🧹',
  eclairage_public: '💡',
  espaces_verts_animaux: '🌳',
  accessibilite_pmr: '♿',
  nuisances_sonores: '🔊',
  tranquillite_publique: '👥',
  stationnement_genant: '🚗',
};

const REPORT_HINTS: Record<ReportSubcategoryId, LocaleText> = {
  voirie_proprete: {
    fr: 'Dépôt sauvage, corbeille débordante, bac non collecté, nid-de-poule, pavé descellé, trottoir dégradé.',
    en: 'Illegal dumping, overflowing bin, uncollected bin, pothole, loose cobble, damaged pavement.',
  },
  eclairage_public: {
    fr: 'Lampadaire éteint ou clignotant, zone sombre le soir, coffret électrique ouvert.',
    en: 'Street light out or flickering, dark area at night, open electrical cabinet.',
  },
  espaces_verts_animaux: {
    fr: 'Arbre à élaguer, jardinière abîmée, souillures canines, nuisibles, animal en difficulté.',
    en: 'Tree to prune, damaged planter, dog fouling, pests, animal in distress.',
  },
  accessibilite_pmr: {
    fr: 'Trottoir infranchissable en fauteuil ou avec une poussette, bateau manquant, obstacle permanent.',
    en: 'Pavement impassable by wheelchair or stroller, missing kerb ramp, permanent obstacle.',
  },
  nuisances_sonores: {
    fr: 'Terrasse tardive, musique répétée, chantier hors horaires, deux-roues bruyants.',
    en: 'Late terrace, repeated music, works outside permitted hours, noisy scooters.',
  },
  tranquillite_publique: {
    fr: 'Regroupement gênant, dégradation, occupation abusive de l’espace public.',
    en: 'Disruptive gathering, vandalism, misuse of public space.',
  },
  stationnement_genant: {
    fr: 'Véhicule sur trottoir, passage piéton, piste cyclable, place PMR ou aire de livraison.',
    en: 'Vehicle on the pavement, crossing, cycle lane, disabled bay or loading area.',
  },
};

const REPORT_TEMPLATES: Record<ReportSubcategoryId, LocaleText> = {
  voirie_proprete: {
    fr: 'Signalement voirie & propreté — quartier des Chartrons\nLieu précis : {{lieu}}\nNature : dépôt sauvage / corbeille pleine / bac non collecté / nid-de-poule / trottoir dégradé\nDepuis quand : \nRisque piéton ou cycliste : oui / non\nPhoto disponible : oui / non',
    en: 'Roads & cleanliness report — Chartrons district\nExact location: {{lieu}}\nIssue: illegal dumping / full bin / uncollected bin / pothole / damaged pavement\nSince when: \nRisk to pedestrians or cyclists: yes / no\nPhoto available: yes / no',
  },
  eclairage_public: {
    fr: 'Signalement éclairage public — quartier des Chartrons\nLieu précis : {{lieu}}\nNature : lampadaire éteint / clignotant / coffret ouvert\nNuméro sur le mât (si visible) : \nZone sombre ou dangereuse le soir : oui / non',
    en: 'Street lighting report — Chartrons district\nExact location: {{lieu}}\nIssue: light out / flickering / open cabinet\nPole number (if visible): \nDark or unsafe area at night: yes / no',
  },
  espaces_verts_animaux: {
    fr: 'Signalement espaces verts & animaux — quartier des Chartrons\nLieu précis : {{lieu}}\nNature : arbre à élaguer / jardinière abîmée / souillures / nuisibles / animal en difficulté\nDepuis quand : \nPhoto disponible : oui / non',
    en: 'Parks & animals report — Chartrons district\nExact location: {{lieu}}\nIssue: tree to prune / damaged planter / fouling / pests / animal in distress\nSince when: \nPhoto available: yes / no',
  },
  accessibilite_pmr: {
    fr: 'Signalement accessibilité PMR / poussettes — quartier des Chartrons\nLieu précis : {{lieu}}\nObstacle : bateau manquant / trottoir trop étroit / mobilier gênant / travaux sans cheminement\nPassage impossible en fauteuil ou avec une poussette : oui / non\nItinéraire de contournement existant : oui / non',
    en: 'Accessibility report (wheelchair / stroller) — Chartrons district\nExact location: {{lieu}}\nObstacle: missing kerb ramp / pavement too narrow / obstructive furniture / works without a path\nImpassable by wheelchair or stroller: yes / no\nAlternative route available: yes / no',
  },
  nuisances_sonores: {
    fr: 'Signalement nuisances sonores — quartier des Chartrons\nLieu précis : {{lieu}}\nType : terrasse / musique / chantier / véhicule\nCréneaux concernés (jours et heures) : \nCaractère répétitif : oui / non',
    en: 'Noise report — Chartrons district\nExact location: {{lieu}}\nType: terrace / music / building works / vehicle\nTimes concerned (days and hours): \nRepeated: yes / no',
  },
  tranquillite_publique: {
    fr: 'Signalement tranquillité publique — quartier des Chartrons\nLieu précis : {{lieu}}\nSituation observée : \nHoraires habituels : \nSituation urgente : non (si oui, appeler le 17)',
    en: 'Public order report — Chartrons district\nExact location: {{lieu}}\nObserved situation: \nUsual times: \nUrgent: no (if yes, call 17)',
  },
  stationnement_genant: {
    fr: 'Signalement stationnement gênant — quartier des Chartrons\nLieu précis : {{lieu}}\nSituation : trottoir / passage piéton / piste cyclable / place PMR / aire de livraison\nGêne pour les piétons ou les secours : oui / non\nPlaque relevée (facultatif) : ',
    en: 'Parking report — Chartrons district\nExact location: {{lieu}}\nSituation: pavement / crossing / cycle lane / disabled bay / loading area\nBlocking pedestrians or emergency access: yes / no\nPlate noted (optional): ',
  },
};

function buildCategory(id: ReportSubcategoryId, channel: CivicChannelId): CivicReportCategory {
  return {
    id,
    channel,
    icon: REPORT_ICONS[id],
    label: REPORT_SUBCATEGORY_LABELS[id],
    hint: REPORT_HINTS[id],
    template: REPORT_TEMPLATES[id],
  };
}

/**
 * Les 7 sous-catégories officielles de signalement, dérivées de la taxonomie partagée :
 * 4 pour la Mairie, 3 pour la Police Municipale.
 */
export const CIVIC_REPORT_CATEGORIES: CivicReportCategory[] = [
  ...CIVIC_SUBCATEGORIES.map((id) => buildCategory(id, 'mairie')),
  ...SAFETY_SUBCATEGORIES.map((id) => buildCategory(id, 'police')),
];

export function buildCivicReportText(
  category: CivicReportCategory,
  lang: string,
  place: string,
  details: string,
): string {
  const isEnglish = lang.toLowerCase().startsWith('en');
  const template = isEnglish ? category.template.en : category.template.fr;
  const filled = template.replace(
    '{{lieu}}',
    place.trim() || (isEnglish ? '(to be specified)' : '(à préciser)'),
  );
  const extra = details.trim();
  const footer = isEnglish
    ? 'Sent from IDÉA CHARTRONS — Chartrons district platform, Bordeaux.'
    : 'Envoyé depuis IDÉA CHARTRONS — plateforme du quartier des Chartrons, Bordeaux.';
  return [filled, extra && `\n${isEnglish ? 'Details' : 'Précisions'} : ${extra}`, `\n${footer}`]
    .filter(Boolean)
    .join('\n');
}
