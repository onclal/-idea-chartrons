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
  id: string;
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
    kicker: { fr: 'Propreté · Voirie · Déchets', en: 'Cleanliness · Roads · Waste' },
    title: { fr: 'Signalement Mairie / Voirie', en: 'Report to the City / Roads dept.' },
    hint: {
      fr: 'Dépôt sauvage, tag, nid-de-poule, éclairage en panne, mobilier urbain cassé, bac non collecté : le service Allô Mairie centralise les demandes du quartier.',
      en: 'Illegal dumping, graffiti, potholes, broken street lighting or urban furniture, uncollected bins: the Allô Mairie service centralises neighborhood requests.',
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
      fr: 'Bruit répété, occupation abusive de l’espace public, stationnement gênant, incivilités : la Police Municipale intervient sur les troubles non urgents du quartier.',
      en: 'Repeated noise, misuse of public space, obstructive parking, antisocial behaviour: the Municipal Police handle non-urgent neighborhood issues.',
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

export const CIVIC_REPORT_CATEGORIES: CivicReportCategory[] = [
  {
    id: 'proprete',
    icon: '🧹',
    channel: 'mairie',
    label: { fr: 'Propreté / dépôt sauvage', en: 'Cleanliness / illegal dumping' },
    hint: {
      fr: 'Sacs abandonnés, encombrants sur le trottoir, corbeille débordante, souillure.',
      en: 'Abandoned bags, bulky items on the pavement, overflowing bin, soiling.',
    },
    template: {
      fr: 'Signalement propreté — quartier des Chartrons\nLieu précis : {{lieu}}\nNature : dépôt sauvage / corbeille pleine / souillure\nDepuis quand : \nPhoto disponible : oui / non',
      en: 'Cleanliness report — Chartrons district\nExact location: {{lieu}}\nIssue: illegal dumping / full bin / soiling\nSince when: \nPhoto available: yes / no',
    },
  },
  {
    id: 'voirie',
    icon: '🚧',
    channel: 'mairie',
    label: { fr: 'Voirie / trottoir dégradé', en: 'Roads / damaged pavement' },
    hint: {
      fr: 'Nid-de-poule, pavé descellé, trottoir dangereux, potelet arraché, grille cassée.',
      en: 'Pothole, loose cobble, dangerous pavement, broken bollard or grate.',
    },
    template: {
      fr: 'Signalement voirie — quartier des Chartrons\nLieu précis : {{lieu}}\nNature : nid-de-poule / pavé descellé / trottoir dangereux\nRisque piéton ou cycliste : oui / non\nPhoto disponible : oui / non',
      en: 'Road report — Chartrons district\nExact location: {{lieu}}\nIssue: pothole / loose cobble / dangerous pavement\nRisk to pedestrians or cyclists: yes / no\nPhoto available: yes / no',
    },
  },
  {
    id: 'eclairage',
    icon: '💡',
    channel: 'mairie',
    label: { fr: 'Éclairage / mobilier urbain', en: 'Street lighting / urban furniture' },
    hint: {
      fr: 'Lampadaire éteint, banc cassé, panneau tombé, arbre à élaguer.',
      en: 'Street light out, broken bench, fallen sign, tree needing pruning.',
    },
    template: {
      fr: 'Signalement éclairage / mobilier — quartier des Chartrons\nLieu précis : {{lieu}}\nNature : lampadaire éteint / banc cassé / panneau tombé\nZone sombre ou dangereuse le soir : oui / non',
      en: 'Lighting / furniture report — Chartrons district\nExact location: {{lieu}}\nIssue: street light out / broken bench / fallen sign\nDark or unsafe area at night: yes / no',
    },
  },
  {
    id: 'dechets',
    icon: '🗑️',
    channel: 'mairie',
    label: { fr: 'Bac non collecté / encombrants', en: 'Uncollected bin / bulky waste' },
    hint: {
      fr: 'Collecte oubliée, bac endommagé, demande d’enlèvement d’encombrants.',
      en: 'Missed collection, damaged bin, bulky-waste pickup request.',
    },
    template: {
      fr: 'Signalement déchets — quartier des Chartrons\nAdresse : {{lieu}}\nNature : collecte non effectuée / bac endommagé / encombrants\nDate de la collecte prévue : ',
      en: 'Waste report — Chartrons district\nAddress: {{lieu}}\nIssue: missed collection / damaged bin / bulky waste\nScheduled collection date: ',
    },
  },
  {
    id: 'bruit',
    icon: '🔊',
    channel: 'police',
    label: { fr: 'Bruit / nuisance sonore', en: 'Noise nuisance' },
    hint: {
      fr: 'Terrasse tardive, musique répétée, chantier hors horaires, deux-roues bruyants.',
      en: 'Late terrace, repeated music, works outside permitted hours, noisy scooters.',
    },
    template: {
      fr: 'Signalement bruit — quartier des Chartrons\nLieu précis : {{lieu}}\nType : terrasse / musique / chantier / véhicule\nCréneaux concernés (jours et heures) : \nCaractère répétitif : oui / non',
      en: 'Noise report — Chartrons district\nExact location: {{lieu}}\nType: terrace / music / building works / vehicle\nTimes concerned (days and hours): \nRepeated: yes / no',
    },
  },
  {
    id: 'stationnement',
    icon: '🚗',
    channel: 'police',
    label: { fr: 'Stationnement gênant', en: 'Obstructive parking' },
    hint: {
      fr: 'Véhicule sur trottoir, passage piéton, piste cyclable, place PMR ou aire de livraison.',
      en: 'Vehicle on the pavement, crossing, cycle lane, disabled bay or loading area.',
    },
    template: {
      fr: 'Signalement stationnement — quartier des Chartrons\nLieu précis : {{lieu}}\nSituation : trottoir / passage piéton / piste cyclable / place PMR\nGêne pour les piétons ou les secours : oui / non',
      en: 'Parking report — Chartrons district\nExact location: {{lieu}}\nSituation: pavement / crossing / cycle lane / disabled bay\nBlocking pedestrians or emergency access: yes / no',
    },
  },
  {
    id: 'incivilite',
    icon: '👥',
    channel: 'police',
    label: { fr: 'Incivilité / occupation abusive', en: 'Antisocial behaviour / misuse of space' },
    hint: {
      fr: 'Regroupement gênant, dégradation, consommation d’alcool sur la voie publique.',
      en: 'Disruptive gathering, vandalism, drinking on public property.',
    },
    template: {
      fr: 'Signalement tranquillité — quartier des Chartrons\nLieu précis : {{lieu}}\nSituation observée : \nHoraires habituels : \nSituation urgente : non (si oui, appeler le 17)',
      en: 'Public order report — Chartrons district\nExact location: {{lieu}}\nObserved situation: \nUsual times: \nUrgent: no (if yes, call 17)',
    },
  },
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
