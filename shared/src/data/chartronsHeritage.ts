/**
 * Contexte historique du quartier des Chartrons (Bordeaux).
 * Utilisé côté serveur pour enrichir le prompt du concierge IA et côté client
 * pour afficher les notes patrimoine sans appel réseau.
 */

export interface HeritageText {
  fr: string;
  en: string;
}

export interface HeritageNote {
  id: string;
  title: HeritageText;
  body: HeritageText;
}

export interface StreetHeritage {
  id: string;
  street: string;
  /** Variantes rencontrées dans les adresses ou les questions des visiteurs. */
  aliases: string[];
  era: string;
  coordinates: { lat: number; lng: number };
  summary: HeritageText;
  trivia: HeritageText;
}

export function normalizeHeritageText(value: string): string {
  return value
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[’']/g, ' ')
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();
}

export const CHARTRONS_DISTRICT_HERITAGE: HeritageNote[] = [
  {
    id: 'origine',
    title: { fr: 'Origine du nom', en: 'Origin of the name' },
    body: {
      fr: 'Le quartier tirerait son nom des moines Chartreux, installés au nord de Bordeaux dès le XIVe siècle, dont les terres et les vignes occupaient ces marais asséchés en bord de Garonne.',
      en: 'The district is said to owe its name to the Carthusian monks, established north of Bordeaux from the 14th century, whose land and vines occupied these drained marshes along the Garonne.',
    },
  },
  {
    id: 'negoce',
    title: { fr: 'Capitale du négoce du vin', en: 'Capital of the wine trade' },
    body: {
      fr: 'Aux XVIIe et XVIIIe siècles, des négociants irlandais, hollandais, allemands et anglais s’installent entre le quai et la rue Notre-Dame. Ils y bâtissent d’immenses chais semi-enterrés où le vin de Bordeaux vieillissait avant d’être embarqué vers l’Europe du Nord.',
      en: 'In the 17th and 18th centuries, Irish, Dutch, German and English wine merchants settled between the quay and rue Notre-Dame. They built vast half-buried cellars where Bordeaux wine aged before being shipped to northern Europe.',
    },
  },
  {
    id: 'architecture',
    title: { fr: 'Architecture des chais', en: 'Cellar architecture' },
    body: {
      fr: 'L’ADN du quartier : façades basses en pierre blonde, grandes portes charretières conçues pour le passage des barriques, verrières d’atelier et cours intérieures pavées. Beaucoup de ces chais sont aujourd’hui des lofts, galeries ou boutiques.',
      en: 'The district’s DNA: low pale-stone façades, wide cart doors sized for wine barrels, workshop glass roofs and paved inner courtyards. Many of these cellars are now lofts, galleries or shops.',
    },
  },
  {
    id: 'aujourdhui',
    title: { fr: 'Le quartier aujourd’hui', en: 'The district today' },
    body: {
      fr: 'Le négoce a laissé place à un village urbain : antiquaires et brocanteurs de la rue Notre-Dame, marché du dimanche matin, cafés du cours Portal et promenade des quais réaménagés.',
      en: 'Trading gave way to an urban village: antique dealers along rue Notre-Dame, the Sunday morning market, cafés on cours Portal and a walk along the redeveloped quays.',
    },
  },
];

export const CHARTRONS_HERITAGE_TIMELINE: { year: string; label: HeritageText }[] = [
  {
    year: 'XIVe s.',
    label: {
      fr: 'Les Chartreux cultivent vignes et jardins sur les marais du nord de Bordeaux.',
      en: 'The Carthusians farm vines and gardens on the marshes north of Bordeaux.',
    },
  },
  {
    year: 'XVIIIe s.',
    label: {
      fr: 'Âge d’or du négoce : hôtels particuliers du Pavé des Chartrons et chais à barriques.',
      en: 'Golden age of the wine trade: mansions on the Pavé des Chartrons and barrel cellars.',
    },
  },
  {
    year: '1869',
    label: {
      fr: 'Construction de la halle du marché des Chartrons, structure métallique et verrière.',
      en: 'The Chartrons market hall is built, with its iron frame and glass roof.',
    },
  },
  {
    year: 'Années 1980',
    label: {
      fr: 'Les chais sont reconvertis en lofts, ateliers d’artistes et galeries.',
      en: 'The cellars are converted into lofts, artists’ studios and galleries.',
    },
  },
  {
    year: 'Aujourd’hui',
    label: {
      fr: 'Quartier de commerces indépendants, brocante et vie de village en ville.',
      en: 'A district of independent shops, antiques and village life in the city.',
    },
  },
];

export const CHARTRONS_STREET_HERITAGE: StreetHeritage[] = [
  {
    id: 'rue-notre-dame',
    street: 'Rue Notre-Dame',
    aliases: ['rue notre dame', 'notre dame', 'notre-dame'],
    era: 'XVIIIe – XIXe siècle',
    coordinates: { lat: 44.8518, lng: -0.5719 },
    summary: {
      fr: 'Colonne vertébrale commerçante des Chartrons, ouverte pour desservir les chais des négociants. Elle concentre aujourd’hui antiquaires, brocanteurs, restaurants et boutiques de créateurs.',
      en: 'The commercial spine of the Chartrons, opened to serve the merchants’ cellars. It now concentrates antique dealers, brocante shops, restaurants and designer boutiques.',
    },
    trivia: {
      fr: 'À mi-parcours se dresse l’église Saint-Louis des Chartrons et ses deux flèches néo-gothiques, financée à la fin du XIXe siècle en grande partie par les familles de négociants du quartier.',
      en: 'Halfway along stands Saint-Louis des Chartrons church with its twin neo-Gothic spires, largely funded in the late 19th century by the district’s merchant families.',
    },
  },
  {
    id: 'cours-portal',
    street: 'Cours Portal',
    aliases: ['cours portal', 'portal'],
    era: 'XIXe siècle',
    coordinates: { lat: 44.8534, lng: -0.5726 },
    summary: {
      fr: 'Axe large et planté qui relie le marché aux quais, bordé d’immeubles de rapport du XIXe siècle. C’est la rue des cafés de quartier, des terrasses et des services du quotidien.',
      en: 'A wide tree-lined axis linking the market to the quays, lined with 19th-century apartment buildings. This is the street of neighborhood cafés, terraces and everyday services.',
    },
    trivia: {
      fr: 'Le cours porte le nom du baron Portal, Bordelais devenu ministre de la Marine sous la Restauration — un clin d’œil au lien du quartier avec le port et le commerce maritime.',
      en: 'The avenue is named after Baron Portal, a Bordeaux native who became Navy minister under the Restoration — a nod to the district’s links with the port and maritime trade.',
    },
  },
  {
    id: 'place-marche',
    street: 'Place du Marché des Chartrons',
    aliases: [
      'place du marche des chartrons',
      'place du marche',
      'marche des chartrons',
      'halle des chartrons',
      'halle',
    ],
    era: '1869',
    coordinates: { lat: 44.8532, lng: -0.5718 },
    summary: {
      fr: 'Cœur social du quartier autour de sa halle de 1869, ossature métallique et verrière typiques de l’architecture des marchés couverts bordelais.',
      en: 'The social heart of the district around its 1869 market hall, with the iron frame and glass roof typical of Bordeaux covered markets.',
    },
    trivia: {
      fr: 'La halle a servi de marché aux légumes, puis d’entrepôt, avant d’être restaurée en salle d’expositions et d’événements. Le marché de plein air du dimanche matin reste le rendez-vous des habitants.',
      en: 'The hall served as a vegetable market, then a warehouse, before being restored as an exhibition and events venue. The Sunday morning open-air market remains the residents’ meeting point.',
    },
  },
  {
    id: 'quai-des-chartrons',
    street: 'Quai des Chartrons',
    aliases: ['quai des chartrons', 'quai', 'quais', 'les quais', 'garonne'],
    era: 'XVIIIe – XXIe siècle',
    coordinates: { lat: 44.8512, lng: -0.5694 },
    summary: {
      fr: 'Front de Garonne d’où partaient les barriques vers l’Angleterre, la Hollande et les pays hanséatiques. Réaménagé en promenade, il offre pistes cyclables, pelouses et vue sur le fleuve.',
      en: 'The Garonne waterfront from which barrels left for England, Holland and the Hanseatic ports. Now redeveloped as a promenade with cycle paths, lawns and river views.',
    },
    trivia: {
      fr: 'Les anneaux d’amarrage et rails encastrés dans le pavé rappellent l’époque où l’on roulait les barriques du chai au gabarre à quelques mètres du fleuve.',
      en: 'Mooring rings and rails set into the cobbles recall the days when barrels were rolled from cellar to barge just metres from the river.',
    },
  },
  {
    id: 'cours-xavier-arnozan',
    street: 'Cours Xavier Arnozan',
    aliases: ['cours xavier arnozan', 'xavier arnozan', 'pave des chartrons', 'arnozan'],
    era: 'XVIIIe siècle',
    coordinates: { lat: 44.8508, lng: -0.5735 },
    summary: {
      fr: 'Ancien « Pavé des Chartrons », la plus belle enfilade d’hôtels particuliers du quartier, construits par les négociants au sommet de leur fortune.',
      en: 'The former “Pavé des Chartrons”, the finest row of private mansions in the district, built by wine merchants at the height of their fortunes.',
    },
    trivia: {
      fr: 'Chaque hôtel cachait derrière sa façade classique un chai de plusieurs centaines de mètres carrés : on habitait au-dessus de son stock de bouteilles.',
      en: 'Behind each classical façade hid a cellar of several hundred square metres: merchants lived directly above their stock of bottles.',
    },
  },
  {
    id: 'rue-borie',
    street: 'Rue Borie',
    aliases: ['rue borie', 'borie'],
    era: 'XVIIIe siècle',
    coordinates: { lat: 44.8542, lng: -0.5695 },
    summary: {
      fr: 'Rue de chais par excellence, encore bordée de longues façades sobres percées de portes charretières. Elle abrite le Musée du Vin et du Négoce.',
      en: 'A cellar street par excellence, still lined with long plain façades pierced by cart doors. It is home to the Wine and Trade Museum.',
    },
    trivia: {
      fr: 'Le musée occupe les caves voûtées d’une maison de négociant du XVIIIe siècle : on y descend pour comprendre comment le vin était assemblé, ouillé puis expédié.',
      en: 'The museum occupies the vaulted cellars of an 18th-century merchant house: you go down to see how wine was blended, topped up and shipped.',
    },
  },
  {
    id: 'cours-de-la-martinique',
    street: 'Cours de la Martinique',
    aliases: ['cours de la martinique', 'martinique'],
    era: 'XIXe siècle',
    coordinates: { lat: 44.8552, lng: -0.572 },
    summary: {
      fr: 'Voie de liaison entre les Chartrons et les Bassins à flot, dont le nom rappelle les échanges du port de Bordeaux avec les Antilles.',
      en: 'A link between the Chartrons and the Bassins à flot docks, whose name recalls the port of Bordeaux’s exchanges with the West Indies.',
    },
    trivia: {
      fr: 'Ce nom fait partie des toponymes coloniaux du port : la ville en assume aujourd’hui la lecture critique dans ses parcours de mémoire.',
      en: 'The name is one of the port’s colonial place names: the city now addresses them critically in its memory trails.',
    },
  },
  {
    id: 'rue-rode',
    street: 'Rue Rode',
    aliases: ['rue rode', 'rode'],
    era: 'XIXe siècle',
    coordinates: { lat: 44.8494, lng: -0.5748 },
    summary: {
      fr: 'Rue de passage entre le Jardin public et les Chartrons, mêlant petits commerces de bouche, ateliers et immeubles bourgeois.',
      en: 'A through street between the Public Garden and the Chartrons, mixing small food shops, workshops and bourgeois buildings.',
    },
    trivia: {
      fr: 'C’est la frontière douce du quartier : au sud on entre dans le Bordeaux du XVIIIe siècle classique, au nord dans le Bordeaux du négoce et des chais.',
      en: 'It is the district’s soft border: south lies classical 18th-century Bordeaux, north the Bordeaux of trade and wine cellars.',
    },
  },
];

/** Rues citées explicitement dans une question ou une adresse. */
export function findStreetHeritage(text: string): StreetHeritage[] {
  const haystack = normalizeHeritageText(text);
  if (!haystack) return [];
  return CHARTRONS_STREET_HERITAGE.filter((entry) =>
    [entry.street, ...entry.aliases].some((alias) => haystack.includes(normalizeHeritageText(alias))),
  );
}

/** Note patrimoine la plus pertinente pour l’adresse d’un commerce. */
export function streetHeritageForAddress(address: string): StreetHeritage | null {
  const matches = findStreetHeritage(address);
  if (matches.length === 0) return null;
  return matches.reduce((best, entry) =>
    normalizeHeritageText(entry.street).length > normalizeHeritageText(best.street).length ? entry : best,
  );
}
