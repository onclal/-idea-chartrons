import type { LocaleText } from '../lib/locale';

export interface WalkStop {
  name: LocaleText;
  latitude: number;
  longitude: number;
}

export interface NeighborhoodWalk {
  id: string;
  icon: string;
  duration: LocaleText;
  title: LocaleText;
  summary: LocaleText;
  stops: WalkStop[];
}

export interface HeritageSpot {
  id: string;
  icon: string;
  title: LocaleText;
  adresse: string;
  summary: LocaleText;
  latitude: number;
  longitude: number;
}

export interface InstagramSpot {
  id: string;
  icon: string;
  title: LocaleText;
  anecdote: LocaleText;
  latitude: number;
  longitude: number;
}

export interface MobilityPlace {
  id: string;
  kind: 'vcub' | 'piste' | 'reparation';
  title: LocaleText;
  hint: LocaleText;
  adresse: string;
  latitude: number;
  longitude: number;
}

export const CHARTRONS_WALKS: NeighborhoodWalk[] = [
  {
    id: 'vin',
    icon: '🍷',
    duration: { fr: '1 h 15 · à pied', en: '1 hr 15 · walking' },
    title: { fr: 'Histoire du vin', en: 'Wine history walk' },
    summary: {
      fr: 'Des chais des négociants aux quais d’embarquement : le fil rouge du négoce bordelais.',
      en: 'From merchants’ cellars to the loading quays: Bordeaux’s wine trade in a walking loop.',
    },
    stops: [
      { name: { fr: 'Quai des Chartrons', en: 'Chartrons quay' }, latitude: 44.8512, longitude: -0.5694 },
      { name: { fr: 'Musée du Vin et du Négoce', en: 'Wine and Trade Museum' }, latitude: 44.8519, longitude: -0.5746 },
      { name: { fr: 'Rue Notre-Dame', en: 'Rue Notre-Dame' }, latitude: 44.8511, longitude: -0.5728 },
      { name: { fr: 'Halles des Chartrons', en: 'Chartrons market hall' }, latitude: 44.8498, longitude: -0.5669 },
    ],
  },
  {
    id: 'brocante',
    icon: '🪑',
    duration: { fr: '50 min · à pied', en: '50 min · walking' },
    title: { fr: 'Brocanteurs & antiquaires', en: 'Antiques & flea-market stroll' },
    summary: {
      fr: 'Vitrines d’antiquaires, ateliers et chine du dimanche autour de Notre-Dame et du marché.',
      en: 'Antique windows, workshops and Sunday browsing around Notre-Dame and the market.',
    },
    stops: [
      { name: { fr: 'Rue Notre-Dame', en: 'Rue Notre-Dame' }, latitude: 44.8511, longitude: -0.5728 },
      { name: { fr: 'Place du Marché des Chartrons', en: 'Chartrons market square' }, latitude: 44.85235, longitude: -0.56985 },
      { name: { fr: 'Cours Portal', en: 'Cours Portal' }, latitude: 44.8532, longitude: -0.5714 },
    ],
  },
  {
    id: 'quais',
    icon: '🚶',
    duration: { fr: '40 min · à pied', en: '40 min · walking' },
    title: { fr: 'Promenade des quais', en: 'Quayside promenade' },
    summary: {
      fr: 'Berges de la Garonne, pavés des négociants et vue ouverte sur le fleuve.',
      en: 'Garonne riverbanks, merchants’ cobblestones and an open view of the river.',
    },
    stops: [
      { name: { fr: 'Pont de pierre (côté Chartrons)', en: 'Stone Bridge (Chartrons side)' }, latitude: 44.8484, longitude: -0.5632 },
      { name: { fr: 'Halles des Chartrons', en: 'Chartrons market hall' }, latitude: 44.8498, longitude: -0.5669 },
      { name: { fr: 'Quai des Chartrons', en: 'Chartrons quay' }, latitude: 44.8512, longitude: -0.5694 },
      { name: { fr: 'Place des Chartrons', en: 'Place des Chartrons' }, latitude: 44.8541, longitude: -0.5718 },
    ],
  },
];

export const HERITAGE_SPOTS: HeritageSpot[] = [
  {
    id: 'halles',
    icon: '🏛️',
    title: { fr: 'Halle des Chartrons', en: 'Chartrons Market Hall' },
    adresse: 'Halles des Chartrons, Quai des Chartrons, 33000 Bordeaux',
    summary: {
      fr: 'Halles gourmandes sur les quais : étals, tables et rendez-vous du quartier.',
      en: 'Food hall on the quays: stalls, tables and a neighborhood meeting place.',
    },
    latitude: 44.8498,
    longitude: -0.5669,
  },
  {
    id: 'notre-dame',
    icon: '🛍️',
    title: { fr: 'Rue Notre-Dame', en: 'Rue Notre-Dame' },
    adresse: 'Rue Notre-Dame, 33000 Bordeaux',
    summary: {
      fr: 'Artère commerçante des Chartrons : boutiques, brocante, cafés et façades XIXᵉ.',
      en: 'The Chartrons high street: shops, antiques, cafés and 19th-century façades.',
    },
    latitude: 44.8511,
    longitude: -0.5728,
  },
  {
    id: 'capc',
    icon: '🎨',
    title: { fr: 'CAPC Musée d’art contemporain', en: 'CAPC Museum of Contemporary Art' },
    adresse: 'Entrepôt Lainé, 7 rue Ferrère, 33000 Bordeaux',
    summary: {
      fr: 'Ancien entrepôt colonial reconverti : collections d’art contemporain au cœur du quartier.',
      en: 'A former colonial warehouse turned contemporary-art museum in the heart of the district.',
    },
    latitude: 44.8486,
    longitude: -0.5719,
  },
  {
    id: 'musee-vin',
    icon: '🍇',
    title: { fr: 'Musée du Vin et du Négoce', en: 'Wine and Trade Museum' },
    adresse: '41 rue Borie, 33300 Bordeaux',
    summary: {
      fr: 'Chais historiques des négociants : barriques, archives et dégustation du négoce chartronnais.',
      en: 'Historic merchants’ cellars: barrels, archives and a taste of Chartrons wine trade.',
    },
    latitude: 44.8519,
    longitude: -0.5746,
  },
];

export const INSTAGRAM_SPOTS: InstagramSpot[] = [
  {
    id: 'quais-sunset',
    icon: '🌅',
    title: { fr: 'Quais au soleil couchant', en: 'Quays at sunset' },
    anecdote: {
      fr: 'Les Chartrons doivent leur nom aux Chartreux, installés ici au XVᵉ siècle. Les quais sont devenus ensuite le théâtre du négoce international du vin.',
      en: 'The district is named after the Carthusian monks who settled here in the 15th century. The quays later became the stage of international wine trade.',
    },
    latitude: 44.8512,
    longitude: -0.5694,
  },
  {
    id: 'facades',
    icon: '📷',
    title: { fr: 'Façades de la rue Notre-Dame', en: 'Rue Notre-Dame façades' },
    anecdote: {
      fr: 'Derrière les vitrines d’antiquaires se cachent d’anciens hôtels de négociants irlandais et anglais, arrivés dès le XVIIIᵉ siècle.',
      en: 'Behind the antique shopfronts stand former townhouses of Irish and English wine merchants, here since the 18th century.',
    },
    latitude: 44.8511,
    longitude: -0.5728,
  },
  {
    id: 'entrepot',
    icon: '🧱',
    title: { fr: 'Entrepôt Lainé (CAPC)', en: 'Lainé Warehouse (CAPC)' },
    anecdote: {
      fr: 'Ces voûtes de pierre accueillaient denrées coloniales avant de devenir l’un des plus beaux musées d’art contemporain de France.',
      en: 'These stone vaults once stored colonial goods, then became one of France’s finest contemporary-art museums.',
    },
    latitude: 44.8486,
    longitude: -0.5719,
  },
  {
    id: 'halles-terrasse',
    icon: '✨',
    title: { fr: 'Terrasse des Halles', en: 'Market hall terrace' },
    anecdote: {
      fr: 'Les Halles actuelles occupent l’emplacement des anciens hangars d’expédition : on y dîne aujourd’hui là où partaient les barriques vers le monde entier.',
      en: 'Today’s food hall stands where shipping sheds once stood: you now dine where barrels left for the world.',
    },
    latitude: 44.8498,
    longitude: -0.5669,
  },
  {
    id: 'marche-dimanche',
    icon: '🌻',
    title: { fr: 'Marché du dimanche', en: 'Sunday market' },
    anecdote: {
      fr: 'Le marché des Chartrons, place du Marché, est l’un des plus animés de Bordeaux : producteurs, fleurs et chine, héritage direct du village de négociants.',
      en: 'The Chartrons Sunday market is one of Bordeaux’s liveliest: growers, flowers and browsing — a direct heir of the merchants’ village.',
    },
    latitude: 44.85235,
    longitude: -0.56985,
  },
];

export const MOBILITY_PLACES: MobilityPlace[] = [
  {
    id: 'vcub-marche',
    kind: 'vcub',
    title: { fr: 'Station VCub — Place du Marché', en: 'VCub station — Market square' },
    hint: { fr: 'Le Vélo / VCub, face au marché du dimanche.', en: 'Le Vélo / VCub, facing the Sunday market.' },
    adresse: 'Place du Marché des Chartrons, 33000 Bordeaux',
    latitude: 44.85235,
    longitude: -0.56985,
  },
  {
    id: 'vcub-capc',
    kind: 'vcub',
    title: { fr: 'Station VCub — CAPC / rue Ferrère', en: 'VCub station — CAPC / rue Ferrère' },
    hint: { fr: 'Accès musée et centre du quartier.', en: 'Access to the museum and the heart of the district.' },
    adresse: 'Rue Ferrère, 33000 Bordeaux',
    latitude: 44.8487,
    longitude: -0.5715,
  },
  {
    id: 'vcub-portal',
    kind: 'vcub',
    title: { fr: 'Station VCub — Place des Chartrons / Portal', en: 'VCub station — Place des Chartrons' },
    hint: { fr: 'Le Vélo, au carrefour nord du quartier.', en: 'Le Vélo, at the northern crossroads of the district.' },
    adresse: 'Place des Chartrons, 33000 Bordeaux',
    latitude: 44.8541,
    longitude: -0.5718,
  },
  {
    id: 'vcub-jardin',
    kind: 'vcub',
    title: { fr: 'Station VCub — Jardin public', en: 'VCub station — Public Garden' },
    hint: { fr: 'Lisière ouest des Chartrons, pratique pour une balade au jardin.', en: 'Western edge of the Chartrons, handy for a garden ride.' },
    adresse: 'Cours de Verdun / Jardin public, 33000 Bordeaux',
    latitude: 44.8482,
    longitude: -0.5774,
  },
  {
    id: 'vcub-quais',
    kind: 'vcub',
    title: { fr: 'Station VCub — Quai des Chartrons', en: 'VCub station — Chartrons quay' },
    hint: { fr: 'Idéale pour enchaîner quais et pistes cyclables.', en: 'Ideal for linking the quays and cycle paths.' },
    adresse: 'Quai des Chartrons, 33000 Bordeaux',
    latitude: 44.8506,
    longitude: -0.5678,
  },
  {
    id: 'piste-quais',
    kind: 'piste',
    title: { fr: 'Piste cyclable des quais', en: 'Quayside cycle path' },
    hint: { fr: 'Voie partagée berges de Garonne, continue vers Bacalan et le centre.', en: 'Shared path along the Garonne, continuing toward Bacalan and the centre.' },
    adresse: 'Quai des Chartrons, 33000 Bordeaux',
    latitude: 44.8512,
    longitude: -0.5694,
  },
  {
    id: 'piste-portal',
    kind: 'piste',
    title: { fr: 'Cours Portal / cours de la Marne', en: 'Cours Portal cycle lane' },
    hint: { fr: 'Liaison nord–sud du quartier, bandes cyclables et sas vélo.', en: 'North–south link with cycle lanes and bike boxes.' },
    adresse: 'Cours Portal, 33000 Bordeaux',
    latitude: 44.8532,
    longitude: -0.5714,
  },
  {
    id: 'pump-marche',
    kind: 'reparation',
    title: { fr: 'Gonflage — station VCub Marché', en: 'Pump — VCub Market station' },
    hint: { fr: 'Pompe publique sur station VCub. Contrôlez la pression avant de partir.', en: 'Public pump on the VCub station. Check tyre pressure before you ride.' },
    adresse: 'Place du Marché des Chartrons, 33000 Bordeaux',
    latitude: 44.85235,
    longitude: -0.56985,
  },
  {
    id: 'pump-capc',
    kind: 'reparation',
    title: { fr: 'Gonflage — station VCub CAPC', en: 'Pump — VCub CAPC station' },
    hint: { fr: 'Pompe publique sur la station VCub rue Ferrère.', en: 'Public pump on the VCub station on rue Ferrère.' },
    adresse: 'Rue Ferrère, 33000 Bordeaux',
    latitude: 44.8487,
    longitude: -0.5715,
  },
  {
    id: 'repair-notre-dame',
    kind: 'reparation',
    title: { fr: 'Atelier vélo — rue Notre-Dame', en: 'Bike workshop — rue Notre-Dame' },
    hint: { fr: 'Réparation, rustines et réglages à deux pas des commerces.', en: 'Repairs, patches and tune-ups a short walk from the shops.' },
    adresse: 'Rue Notre-Dame, 33000 Bordeaux',
    latitude: 44.8508,
    longitude: -0.5726,
  },
];
