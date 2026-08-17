import type { LocaleText } from '../lib/locale';

export interface EmergencyContact {
  id: string;
  number: string;
  icon: string;
  label: LocaleText;
  hint: LocaleText;
  priority: 'vital' | 'local';
}

export interface RiskAlert {
  id: string;
  icon: string;
  title: LocaleText;
  body: LocaleText;
  href?: string;
  hrefLabel?: LocaleText;
}

export interface EvacuationStep {
  id: string;
  title: LocaleText;
  body: LocaleText;
}

export interface GatheringPoint {
  id: string;
  name: LocaleText;
  adresse: string;
  latitude: number;
  longitude: number;
  hint: LocaleText;
}

/** Barre d’urgence en un geste : numéros nationaux + relais municipal. */
export const EMERGENCY_BAR: EmergencyContact[] = [
  {
    id: 'samu',
    number: '15',
    icon: '🚑',
    label: { fr: 'SAMU', en: 'SAMU (ambulance)' },
    hint: {
      fr: 'Urgence médicale vitale : malaise, douleur thoracique, perte de connaissance.',
      en: 'Life-threatening medical emergency: collapse, chest pain, loss of consciousness.',
    },
    priority: 'vital',
  },
  {
    id: 'police',
    number: '17',
    icon: '🚓',
    label: { fr: 'Police Secours', en: 'Police emergency' },
    hint: {
      fr: 'Agression, cambriolage en cours, danger immédiat pour les personnes.',
      en: 'Assault, burglary in progress, immediate danger to people.',
    },
    priority: 'vital',
  },
  {
    id: 'pompiers',
    number: '18',
    icon: '🚒',
    label: { fr: 'Pompiers', en: 'Fire brigade' },
    hint: {
      fr: 'Incendie, fuite de gaz, inondation d’un immeuble, personne bloquée.',
      en: 'Fire, gas leak, flooded building, trapped person.',
    },
    priority: 'vital',
  },
  {
    id: 'europe',
    number: '112',
    icon: '🆘',
    label: { fr: 'Urgence européenne', en: 'European emergency' },
    hint: {
      fr: 'Numéro unique depuis un mobile, utilisable dans toutes les langues de l’UE.',
      en: 'Single number from a mobile, usable in all EU languages.',
    },
    priority: 'vital',
  },
  {
    id: 'sourds',
    number: '114',
    icon: '💬',
    label: { fr: 'Urgence sourds & malentendants', en: 'Deaf & hard-of-hearing emergency' },
    hint: {
      fr: 'Urgence par SMS ou visio, accessible 24h/24 sans appel vocal.',
      en: 'Emergency by SMS or video, available 24/7 without a voice call.',
    },
    priority: 'vital',
  },
  {
    id: 'police-municipale',
    number: '05 56 10 20 30',
    icon: '🛡️',
    label: { fr: 'Police Municipale Bordeaux', en: 'Bordeaux Municipal Police' },
    hint: {
      fr: 'Troubles non urgents du quartier : bruit, stationnement, incivilités (via Allô Mairie).',
      en: 'Non-urgent neighborhood issues: noise, parking, antisocial behaviour (via Allô Mairie).',
    },
    priority: 'local',
  },
  {
    id: 'pharmacie',
    number: '3237',
    icon: '💊',
    label: { fr: 'Pharmacie de garde', en: 'On-duty pharmacy' },
    hint: {
      fr: 'Pharmacie ouverte la nuit, le dimanche et les jours fériés.',
      en: 'Pharmacy open at night, on Sundays and public holidays.',
    },
    priority: 'local',
  },
];

export const RISK_ALERTS: RiskAlert[] = [
  {
    id: 'crue-garonne',
    icon: '🌊',
    title: { fr: 'Crue et submersion de la Garonne', en: 'Garonne flooding and overflow' },
    body: {
      fr: 'Les Chartrons touchent le fleuve : lors des grandes marées et des crues, les quais et les rues basses peuvent être submergés en quelques dizaines de minutes. Surveillez la vigilance crue, ne stationnez pas sur les quais et ne descendez jamais dans un parking souterrain pendant l’alerte.',
      en: 'The Chartrons border the river: during spring tides and floods, the quays and low-lying streets can be submerged within tens of minutes. Watch flood warnings, avoid parking on the quays and never enter an underground car park during an alert.',
    },
    href: 'https://www.vigicrues.gouv.fr',
    hrefLabel: { fr: 'Vigilance crue (Vigicrues)', en: 'Flood watch (Vigicrues)' },
  },
  {
    id: 'meteo',
    icon: '⛈️',
    title: { fr: 'Vigilance météo (tempête, canicule)', en: 'Weather warning (storm, heatwave)' },
    body: {
      fr: 'Vent violent sur les quais, orages, canicule : en vigilance orange ou rouge, restez à l’abri, rentrez le mobilier de terrasse et évitez les bords de Garonne et les arbres du Jardin public.',
      en: 'Strong winds on the quays, thunderstorms, heatwaves: under orange or red warnings, stay indoors, bring in terrace furniture and avoid the riverbanks and the Public Garden trees.',
    },
    href: 'https://vigilance.meteofrance.fr',
    hrefLabel: { fr: 'Vigilance Météo-France', en: 'Météo-France warnings' },
  },
  {
    id: 'fr-alert',
    icon: '📲',
    title: { fr: 'FR-Alert sur votre téléphone', en: 'FR-Alert on your phone' },
    body: {
      fr: 'En cas de danger grave, l’État diffuse une alerte sonore sur tous les mobiles présents dans la zone, avec la consigne à appliquer. Ne raccrochez pas, lisez le message en entier : il prime sur toute autre information.',
      en: 'In the event of serious danger, the State broadcasts an audible alert to every mobile in the area with the instruction to follow. Read the whole message: it overrides any other information.',
    },
  },
  {
    id: 'gaz',
    icon: '🔥',
    title: { fr: 'Odeur de gaz ou fumée dans un immeuble', en: 'Gas smell or smoke in a building' },
    body: {
      fr: 'N’actionnez aucun interrupteur ni sonnette, ne prenez pas l’ascenseur. Sortez, faites sortir vos voisins, puis appelez le 18 ou le 112 depuis l’extérieur.',
      en: 'Do not touch switches or doorbells and do not use the lift. Get out, alert your neighbours, then call 18 or 112 from outside.',
    },
  },
];

export const EVACUATION_STEPS: EvacuationStep[] = [
  {
    id: 'ecouter',
    title: { fr: '1. Écoutez l’alerte officielle', en: '1. Listen to the official alert' },
    body: {
      fr: 'Sirène, FR-Alert, radio locale ou porte-à-porte des secours. La consigne peut être de rester à l’abri (confinement) ou d’évacuer : appliquez celle qui est annoncée, jamais les deux.',
      en: 'Siren, FR-Alert, local radio or door-to-door from emergency services. The instruction may be to shelter in place or to evacuate: follow the one announced, never both.',
    },
  },
  {
    id: 'couper',
    title: { fr: '2. Coupez et fermez', en: '2. Switch off and close up' },
    body: {
      fr: 'Coupez gaz et électricité si vous évacuez, fermez portes et fenêtres, montez les objets de valeur à l’étage en cas de risque d’eau.',
      en: 'Turn off gas and electricity if you evacuate, close doors and windows, and move valuables upstairs if water is expected.',
    },
  },
  {
    id: 'sac',
    title: { fr: '3. Prenez un sac d’urgence léger', en: '3. Take a light emergency bag' },
    body: {
      fr: 'Papiers d’identité, téléphone chargé et batterie externe, médicaments et ordonnances, eau, lampe, vêtements chauds. Laissez tout le reste.',
      en: 'ID papers, charged phone and power bank, medication and prescriptions, water, torch, warm clothes. Leave everything else.',
    },
  },
  {
    id: 'sens',
    title: { fr: '4. Éloignez-vous du fleuve, à pied', en: '4. Move away from the river, on foot' },
    body: {
      fr: 'Aux Chartrons, le terrain remonte en s’éloignant de la Garonne : dirigez-vous vers l’ouest (rue Notre-Dame puis Jardin public). Ne prenez pas la voiture, ne traversez jamais une rue inondée.',
      en: 'In the Chartrons the ground rises away from the Garonne: head west (rue Notre-Dame, then the Public Garden). Do not take your car and never cross a flooded street.',
    },
  },
  {
    id: 'regroupement',
    title: { fr: '5. Rejoignez un point de regroupement', en: '5. Reach an assembly point' },
    body: {
      fr: 'Signalez-vous aux secours ou aux agents municipaux sur place, n’allez pas chercher vos enfants à l’école : les établissements gardent et protègent les élèves.',
      en: 'Check in with emergency workers or municipal staff on site. Do not collect children from school: schools keep and protect pupils.',
    },
  },
  {
    id: 'retour',
    title: { fr: '6. Ne rentrez qu’après le feu vert', en: '6. Return only when cleared' },
    body: {
      fr: 'Attendez l’annonce officielle de fin d’alerte. Aérez, ne consommez pas l’eau du robinet si elle est déconseillée, et faites vérifier gaz et électricité avant de les rétablir.',
      en: 'Wait for the official all-clear. Ventilate, do not drink tap water if advised against, and have gas and electricity checked before switching them back on.',
    },
  },
];

export const GATHERING_POINTS: GatheringPoint[] = [
  {
    id: 'jardin-public',
    name: { fr: 'Jardin public (côté cours de Verdun)', en: 'Public Garden (cours de Verdun side)' },
    adresse: 'Cours de Verdun, 33000 Bordeaux',
    latitude: 44.8484,
    longitude: -0.5779,
    hint: {
      fr: 'Grand espace dégagé en hauteur, hors zone inondable, à environ 10 minutes à pied du marché.',
      en: 'Large open space on higher ground, outside the flood zone, about a 10-minute walk from the market.',
    },
  },
  {
    id: 'place-marche',
    name: { fr: 'Place du Marché des Chartrons', en: 'Chartrons market square' },
    adresse: 'Place du Marché des Chartrons, 33000 Bordeaux',
    latitude: 44.8532,
    longitude: -0.5718,
    hint: {
      fr: 'Point de rassemblement central du quartier, repérable par tous et à l’écart des quais.',
      en: 'Central neighborhood meeting point, easy for everyone to find and set back from the quays.',
    },
  },
  {
    id: 'eglise-saint-louis',
    name: { fr: 'Parvis de l’église Saint-Louis des Chartrons', en: 'Saint-Louis des Chartrons church forecourt' },
    adresse: '51 Rue Notre-Dame, 33000 Bordeaux',
    latitude: 44.8518,
    longitude: -0.5714,
    hint: {
      fr: 'Repère visible de toute la rue Notre-Dame, utile pour se retrouver en famille ou entre voisins.',
      en: 'Landmark visible from the whole of rue Notre-Dame, useful for finding family or neighbours.',
    },
  },
];

export const PCS_NOTICE: LocaleText = {
  fr: 'Ces consignes reprennent la logique du Plan Communal de Sauvegarde (PCS) de Bordeaux : elles vous aident à réagir vite, mais la consigne officielle diffusée le jour de l’alerte (sirène, FR-Alert, agents municipaux) prime toujours. Les points de regroupement ci-dessous sont des repères de quartier conseillés : confirmez le lieu officiel auprès de la Mairie lors d’une alerte réelle.',
  en: 'These instructions follow the logic of Bordeaux’s Communal Safeguard Plan (PCS): they help you react fast, but the official instruction issued on the day (siren, FR-Alert, municipal staff) always takes precedence. The assembly points below are recommended neighborhood landmarks: confirm the official location with the City during a real alert.',
};

export function buildSafetySheetText(lang: string): string {
  const isEnglish = lang.toLowerCase().startsWith('en');
  const pick = (text: LocaleText) => (isEnglish ? text.en : text.fr);
  const lines: string[] = [
    isEnglish ? 'IDÉA CHARTRONS — Emergency & evacuation sheet' : 'IDÉA CHARTRONS — Fiche urgences & évacuation',
    isEnglish ? 'Chartrons district · Bordeaux' : 'Quartier des Chartrons · Bordeaux',
    '',
    isEnglish ? 'EMERGENCY NUMBERS' : 'NUMÉROS D’URGENCE',
  ];
  for (const contact of EMERGENCY_BAR) {
    lines.push(`${contact.number} — ${pick(contact.label)} : ${pick(contact.hint)}`);
  }
  lines.push('', isEnglish ? 'LOCAL RISKS' : 'RISQUES LOCAUX');
  for (const alert of RISK_ALERTS) {
    lines.push(`${pick(alert.title)} : ${pick(alert.body)}`);
  }
  lines.push('', isEnglish ? 'EVACUATION STEPS' : 'CONSIGNES D’ÉVACUATION');
  for (const step of EVACUATION_STEPS) {
    lines.push(`${pick(step.title)} : ${pick(step.body)}`);
  }
  lines.push('', isEnglish ? 'ASSEMBLY POINTS' : 'POINTS DE REGROUPEMENT');
  for (const point of GATHERING_POINTS) {
    lines.push(`${pick(point.name)} — ${point.adresse} : ${pick(point.hint)}`);
  }
  lines.push('', pick(PCS_NOTICE));
  return lines.join('\n');
}

export function downloadSafetySheet(lang: string): void {
  const blob = new Blob([buildSafetySheetText(lang)], { type: 'text/plain;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = 'consignes-urgence-chartrons.txt';
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}
