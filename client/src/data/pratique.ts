import type { LocaleText } from '../lib/locale';

export interface PracticalPlace {
  id: string;
  title: LocaleText;
  hint: LocaleText;
  adresse?: string;
  phone?: string;
  latitude?: number;
  longitude?: number;
  href?: string;
}

export interface EmergencyArtisan {
  id: string;
  trade: LocaleText;
  name: LocaleText;
  adresse: string;
  phone: string;
  hint: LocaleText;
}

export const WELCOME_KIT_SECTIONS: { title: LocaleText; body: LocaleText }[] = [
  {
    title: { fr: 'Bienvenue aux Chartrons', en: 'Welcome to the Chartrons' },
    body: {
      fr: 'Quartier de Bordeaux entre Garonne et Jardin public : commerces de proximité, quais, marché du dimanche et vie de village en ville.',
      en: 'A Bordeaux district between the Garonne and the Public Garden: local shops, quays, Sunday market and village life in the city.',
    },
  },
  {
    title: { fr: 'Pour les hôtes', en: 'For hosts' },
    body: {
      fr: 'Remettez ce kit à vos voyageurs : tri, stationnement, urgences, balades et numéros utiles. Le quartier se parcourt surtout à pied ou à vélo.',
      en: 'Hand this kit to your guests: recycling, parking, emergencies, walks and useful numbers. The district is best explored on foot or by bike.',
    },
  },
  {
    title: { fr: 'Pour les voyageurs', en: 'For travelers' },
    body: {
      fr: 'Marché le dimanche matin (place du Marché), Halles sur les quais, rue Notre-Dame pour flâner. Pharmacie de garde : 3237.',
      en: 'Sunday morning market (market square), food hall on the quays, rue Notre-Dame for a stroll. On-duty pharmacy: 3237.',
    },
  },
  {
    title: { fr: 'Pour les nouveaux habitants', en: 'For new residents' },
    body: {
      fr: 'Inscrivez-vous à Bordeaux Métropole pour le tri et les encombrants. Composteurs collectifs et horodateur en ligne (PayByPhone) sont détaillés plus bas.',
      en: 'Register with Bordeaux Métropole for recycling and bulky-waste pickup. Collective composters and the PayByPhone meter are detailed below.',
    },
  },
];

export function buildWelcomeKitText(lang: string): string {
  const en = lang.toLowerCase().startsWith('en');
  const lines = [
    en ? 'IDÉA CHARTRONS — Welcome kit' : 'IDÉA CHARTRONS — Kit d’accueil',
    en ? 'Chartrons district · Bordeaux' : 'Quartier des Chartrons · Bordeaux',
    '',
  ];
  for (const section of WELCOME_KIT_SECTIONS) {
    lines.push(en ? section.title.en : section.title.fr);
    lines.push(en ? section.body.en : section.body.fr);
    lines.push('');
  }
  lines.push(en ? 'Useful numbers' : 'Numéros utiles');
  lines.push(en ? 'SAMU 15 · Police 17 · Fire 18 · 112 · Pharmacy 3237' : 'SAMU 15 · Police 17 · Pompiers 18 · 112 · Pharmacie 3237');
  lines.push('');
  lines.push('PayByPhone : https://www.paybyphone.fr');
  lines.push(
    en
      ? 'Bulky waste appointment : https://www.bordeaux-metropole.fr'
      : 'Encombrants sur RDV : https://www.bordeaux-metropole.fr',
  );
  return lines.join('\n');
}

export function downloadWelcomeKit(lang: string): void {
  const text = buildWelcomeKitText(lang);
  const blob = new Blob([text], { type: 'text/plain;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = 'kit-accueil-chartrons.txt';
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

export const WASTE_SCHEDULE: { id: string; title: LocaleText; hint: LocaleText }[] = [
  {
    id: 'jaune',
    title: { fr: 'Bacs jaunes — emballages & papiers', en: 'Yellow bins — packaging & paper' },
    hint: {
      fr: 'Collecte en général les mardis et vendredis matin (secteur Chartrons). Sortez les bacs la veille au soir. Verre : colonnes d’apport volontaire, pas dans le jaune.',
      en: 'Usually collected Tuesday and Friday mornings (Chartrons sector). Put bins out the evening before. Glass: bring-banks only, never in the yellow bin.',
    },
  },
  {
    id: 'ordures',
    title: { fr: 'Ordures ménagères', en: 'Household waste' },
    hint: {
      fr: 'Bacs gris / sacs : collecte en soirée ou tôt le matin selon la rue. Respectez les horaires affichés sur votre bac ou l’appli Bordeaux Métropole.',
      en: 'Grey bins / bags: evening or early-morning collection depending on the street. Follow the times on your bin or the Bordeaux Métropole app.',
    },
  },
  {
    id: 'verre',
    title: { fr: 'Verre — apport volontaire', en: 'Glass — bring-bank' },
    hint: {
      fr: 'Colonnes à verre place du Marché, quais et abords du Jardin public. Pas de porcelaine ni de vaisselle.',
      en: 'Glass banks on the market square, quays and near the Public Garden. No crockery or porcelain.',
    },
  },
];

export const COMPOSTERS: PracticalPlace[] = [
  {
    id: 'compost-marche',
    title: { fr: 'Composteur — place du Marché', en: 'Composter — market square' },
    hint: {
      fr: 'Composteur collectif de quartier. Bio-seaux acceptés : épluchures, marc, filtres (sans plastique).',
      en: 'Neighborhood collective compost. Accepted: peelings, coffee grounds, filters (no plastic).',
    },
    adresse: 'Place du Marché des Chartrons, 33000 Bordeaux',
    latitude: 44.85235,
    longitude: -0.56985,
  },
  {
    id: 'compost-jardin',
    title: { fr: 'Composteur — Jardin public (côté Chartrons)', en: 'Composter — Public Garden (Chartrons side)' },
    hint: {
      fr: 'Site d’apport volontaire géré avec les associations de compostage. Horaires affichés sur place.',
      en: 'Bring site run with composting associations. Opening times posted on site.',
    },
    adresse: 'Cours de Verdun / Jardin public, 33000 Bordeaux',
    latitude: 44.8489,
    longitude: -0.5774,
  },
  {
    id: 'compost-quais',
    title: { fr: 'Composteur — quais / Halles', en: 'Composter — quays / market hall' },
    hint: {
      fr: 'Point d’apport proche des Halles. Déchets de cuisine uniquement, pas de sacs plastique.',
      en: 'Drop-off near the food hall. Kitchen waste only, no plastic bags.',
    },
    adresse: 'Quai des Chartrons, 33000 Bordeaux',
    latitude: 44.8502,
    longitude: -0.5674,
  },
];

export const BULKY_WASTE = {
  title: { fr: 'Encombrants sur rendez-vous', en: 'Bulky waste by appointment' },
  hint: {
    fr: 'Ne déposez rien sur le trottoir. 1) Connectez-vous au service Bordeaux Métropole. 2) Choisissez « Encombrants ». 3) Indiquez l’adresse aux Chartrons et le créneau. 4) Sortez les objets le matin du passage, sans encombrer le passage piéton.',
    en: 'Do not leave items on the pavement. 1) Open Bordeaux Métropole’s service. 2) Choose “Bulky waste”. 3) Enter the Chartrons address and a slot. 4) Put items out on the morning of collection, without blocking the pavement.',
  },
  href: 'https://www.bordeaux-metropole.fr/vie-quotidienne/dechets',
  phone: '05 56 99 88 77',
};

export const PARKING_RULES: { title: LocaleText; hint: LocaleText }[] = [
  {
    title: { fr: 'Stationnement payant de voirie', en: 'Paid on-street parking' },
    hint: {
      fr: 'Zone payante en semaine (en général 9h–19h). Résidents : carte de stationnement Bordeaux Métropole. Dimanche souvent gratuit hors événements.',
      en: 'Paid zone on weekdays (usually 9am–7pm). Residents: Bordeaux Métropole parking card. Sundays often free except during events.',
    },
  },
  {
    title: { fr: 'Livraisons & arrêts minutes', en: 'Deliveries & short stops' },
    hint: {
      fr: 'Aires de livraison limitées. Deux-roues : stationnez sur les emplacements matérialisés, pas sur les trottoirs ni les pistes.',
      en: 'Limited loading bays. Two-wheelers: use marked bays, not pavements or cycle lanes.',
    },
  },
];

export const COVERED_PARKINGS: PracticalPlace[] = [
  {
    id: 'parking-chartrons',
    title: { fr: 'Parking Chartrons (couvert)', en: 'Chartrons car park (covered)' },
    hint: { fr: 'Accès quais / Halles. Surveillez la hauteur et les horaires d’entrée.', en: 'Access to the quays / food hall. Check clearance and entry hours.' },
    adresse: 'Quai des Chartrons, 33000 Bordeaux',
    latitude: 44.8504,
    longitude: -0.5672,
  },
  {
    id: 'parking-cite-vin',
    title: { fr: 'Parking Cité du Vin', en: 'Cité du Vin car park' },
    hint: { fr: 'Nord du quartier, pratique pour Bacalan / quais hauts.', en: 'North of the district, handy for Bacalan / upper quays.' },
    adresse: 'Esplanade de Pontac, 33300 Bordeaux',
    latitude: 44.8625,
    longitude: -0.5506,
  },
  {
    id: 'parking-hangars',
    title: { fr: 'Parking des Hangars (Bassins à flot)', en: 'Hangars car park (Bassins à flot)' },
    hint: { fr: 'Couvert, au nord des Chartrons. Utile les soirs d’événements.', en: 'Covered, north of the Chartrons. Useful on event evenings.' },
    adresse: 'Rue Achard / Bassins à flot, 33300 Bordeaux',
    latitude: 44.8608,
    longitude: -0.5542,
  },
];

export const PAYBYPHONE_URL = 'https://www.paybyphone.fr';

export const WORK_CAFES: PracticalPlace[] = [
  {
    id: 'halles-wifi',
    title: { fr: 'Halles des Chartrons', en: 'Chartrons Market Hall' },
    hint: { fr: 'Tables, Wi-Fi des commerces, prises selon les stands. Idéal en journée.', en: 'Tables, shop Wi-Fi, sockets depending on the stall. Good in daytime.' },
    adresse: 'Halles des Chartrons, Quai des Chartrons, 33000 Bordeaux',
    latitude: 44.8498,
    longitude: -0.5669,
  },
  {
    id: 'notre-dame-cafe',
    title: { fr: 'Cafés rue Notre-Dame', en: 'Cafés on rue Notre-Dame' },
    hint: { fr: 'Terrasses work-friendly, souvent Wi-Fi. Demandez le code à la caisse.', en: 'Work-friendly terraces, often with Wi-Fi. Ask at the counter for the password.' },
    adresse: 'Rue Notre-Dame, 33000 Bordeaux',
    latitude: 44.8511,
    longitude: -0.5728,
  },
  {
    id: 'quais-cafe',
    title: { fr: 'Cafés des quais', en: 'Quayside cafés' },
    hint: { fr: 'Vue Garonne, prises parfois limitées. Privilégiez le matin en semaine.', en: 'Garonne view, sockets sometimes limited. Best on weekday mornings.' },
    adresse: 'Quai des Chartrons, 33000 Bordeaux',
    latitude: 44.8512,
    longitude: -0.5694,
  },
  {
    id: 'portal-wifi',
    title: { fr: 'Cafés cours Portal', en: 'Cafés on cours Portal' },
    hint: { fr: 'Espaces Wi-Fi, prises et tables pour travailler en semaine.', en: 'Wi-Fi, sockets and tables for weekday remote work.' },
    adresse: 'Cours Portal, 33000 Bordeaux',
    latitude: 44.8532,
    longitude: -0.5714,
  },
];

export const PAWS_PLACES: PracticalPlace[] = [
  {
    id: 'jardin-public',
    title: { fr: 'Jardin public — chiens tenus en laisse', en: 'Public Garden — dogs on a lead' },
    hint: { fr: 'Grand parc ombragé en lisière des Chartrons. Laisse obligatoire, sacs à déjections.', en: 'Large shaded park on the edge of the Chartrons. Lead required, waste bags too.' },
    adresse: 'Jardin public, 33000 Bordeaux',
    latitude: 44.8482,
    longitude: -0.5781,
  },
  {
    id: 'quais-chiens',
    title: { fr: 'Berges de Garonne', en: 'Garonne riverbanks' },
    hint: { fr: 'Promenade possible hors pistes cyclables. Tenez votre chien près des vélos et runners.', en: 'Walk possible off the cycle path. Keep dogs close around bikes and runners.' },
    adresse: 'Quai des Chartrons, 33000 Bordeaux',
    latitude: 44.8512,
    longitude: -0.5694,
  },
  {
    id: 'veto-chartrons',
    title: { fr: 'Clinique vétérinaire du quartier', en: 'Neighborhood veterinary clinic' },
    hint: { fr: 'Soins courants et urgences en journée. Appelez avant de vous déplacer.', en: 'Routine care and daytime emergencies. Call before you go.' },
    adresse: 'Cours Portal, 33000 Bordeaux',
    phone: '05 56 39 12 40',
    latitude: 44.8532,
    longitude: -0.5714,
  },
  {
    id: 'veto-notre-dame',
    title: { fr: 'Vétérinaire — rue Notre-Dame', en: 'Vet — rue Notre-Dame' },
    hint: { fr: 'Consultations de proximité. Appelez pour un rendez-vous ou une urgence du jour.', en: 'Neighborhood consultations. Call for an appointment or same-day emergency.' },
    adresse: 'Rue Notre-Dame, 33000 Bordeaux',
    phone: '05 56 48 12 41',
    latitude: 44.8511,
    longitude: -0.5728,
  },
];

export const HEALTH_PLACES: PracticalPlace[] = [
  {
    id: 'pharma-garde',
    title: { fr: 'Pharmacie de garde', en: 'On-duty pharmacy' },
    hint: { fr: 'Numéro national 3237 (service vocal) ou 3237.fr pour la pharmacie ouverte ce soir.', en: 'National number 3237 (voice) or 3237.fr for the pharmacy open tonight.' },
    phone: '3237',
    href: 'https://www.3237.fr',
  },
  {
    id: 'pharma-notre-dame',
    title: { fr: 'Pharmacie de proximité — Notre-Dame', en: 'Neighborhood pharmacy — Notre-Dame' },
    hint: { fr: 'Ouverte en journée. Pour la garde de nuit et dimanche, composez le 3237.', en: 'Open in daytime. For nights and Sundays, dial 3237.' },
    adresse: 'Rue Notre-Dame, 33000 Bordeaux',
    phone: '05 56 81 24 31',
    latitude: 44.8510,
    longitude: -0.5725,
  },
  {
    id: 'maison-sante',
    title: { fr: 'Maison de santé / soins de proximité', en: 'Local health centre' },
    hint: { fr: 'Médecins, infirmiers et soins non vitaux. Appelez pour un créneau le jour même.', en: 'GPs, nurses and non-emergency care. Call for a same-day slot.' },
    adresse: 'Cours Portal, 33000 Bordeaux',
    phone: '05 56 81 24 30',
    latitude: 44.8534,
    longitude: -0.5716,
  },
  {
    id: 'samu',
    title: { fr: 'SAMU — urgence vitale', en: 'SAMU — life-threatening emergency' },
    hint: { fr: 'Composez le 15 (ou 112). Ne vous déplacez pas si la situation est critique.', en: 'Dial 15 (or 112). Do not travel if the situation is critical.' },
    phone: '15',
  },
];

export const EMERGENCY_NUMBERS: { label: LocaleText; phone: string }[] = [
  { label: { fr: 'SAMU', en: 'SAMU (ambulance)' }, phone: '15' },
  { label: { fr: 'Police secours', en: 'Police' }, phone: '17' },
  { label: { fr: 'Pompiers', en: 'Fire brigade' }, phone: '18' },
  { label: { fr: 'Urgence européenne', en: 'EU emergency' }, phone: '112' },
  { label: { fr: 'Pharmacie de garde', en: 'On-duty pharmacy' }, phone: '3237' },
];

export const EMERGENCY_ARTISANS: EmergencyArtisan[] = [
  {
    id: 'serrurier',
    trade: { fr: 'Serrurier', en: 'Locksmith' },
    name: { fr: 'Serrurerie Chartrons Express', en: 'Chartrons Express Locksmith' },
    adresse: 'Rue Notre-Dame, 33000 Bordeaux',
    phone: '+33612480021',
    hint: { fr: 'Ouverture de porte, dépannage 7j/7. Demandez le devis avant intervention.', en: 'Door opening, 7-day call-out. Ask for a quote before any work.' },
  },
  {
    id: 'plombier',
    trade: { fr: 'Plombier', en: 'Plumber' },
    name: { fr: 'Plomberie des Quais', en: 'Quayside Plumbing' },
    adresse: 'Quai des Chartrons, 33000 Bordeaux',
    phone: '+33612480022',
    hint: { fr: 'Fuite, WC, chauffe-eau. Intervention de proximité aux Chartrons.', en: 'Leaks, toilets, water heaters. Neighborhood call-out in the Chartrons.' },
  },
  {
    id: 'electricien',
    trade: { fr: 'Électricien', en: 'Electrician' },
    name: { fr: 'Électricité Portal', en: 'Portal Electrical' },
    adresse: 'Cours Portal, 33000 Bordeaux',
    phone: '+33556481230',
    hint: { fr: 'Panne de courant, tableau, urgence habitation. Intervention en journée et soir.', en: 'Power cut, fuse board, home emergency. Day and evening call-out.' },
  },
];
