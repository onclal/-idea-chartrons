import type { LocaleText } from '../lib/locale';

export type FaqAudienceId = 'habitants' | 'commercants' | 'services';

export interface FaqItem {
  id: string;
  q: LocaleText;
  a: LocaleText;
}

export interface FaqAudience {
  id: FaqAudienceId;
  icon: string;
  label: LocaleText;
  kicker: LocaleText;
  intro: LocaleText;
  items: FaqItem[];
  cta: {
    to: string;
    label: LocaleText;
  };
}

export const FAQ_PAGE = {
  kicker: { fr: 'Aide & questions', en: 'Help & questions' },
  title: { fr: 'FAQ IDÉA CHARTRONS', en: 'IDÉA CHARTRONS FAQ' },
  subtitle: {
    fr: 'Plateforme civique de l’association du quartier : habitants 100 % gratuits, commerces visibles avec contacts cliquables, Premium Pro pour le site web, la priorité IA et les modules d’action.',
    en: 'Civic platform of the neighborhood association: residents 100% free, businesses listed with clickable contacts, Premium Pro for the website, AI priority and action modules.',
  },
} as const satisfies Record<string, LocaleText>;

export const FAQ_AUDIENCES: FaqAudience[] = [
  {
    id: 'habitants',
    icon: '🏘️',
    label: { fr: 'Pour les Habitants', en: 'For residents' },
    kicker: { fr: 'Habitants & visiteurs', en: 'Residents & visitors' },
    intro: {
      fr: 'L’annuaire, les avis et les annonces du quartier sont 100 % gratuits, sans compte. Un code à 4 chiffres (e-mail ou SMS) valide seulement la première publication.',
      en: 'The directory, reviews and neighborhood posts are 100% free, with no account. A 4-digit code (email or SMS) only validates the first post.',
    },
    cta: {
      to: '/acteurs',
      label: { fr: 'Explorer l’annuaire', en: 'Browse the directory' },
    },
    items: [
      {
        id: 'what-is',
        q: { fr: 'Qu’est-ce qu’IDÉA CHARTRONS ?', en: 'What is IDÉA CHARTRONS?' },
        a: {
          fr: 'C’est le concierge civique et l’annuaire hyper-local du quartier des Chartrons à Bordeaux, porté par l’association. Habitants, visiteurs et commerces de proximité y trouvent 362 adresses réelles, des annonces d’entraide et un assistant IA cantonné au quartier.',
          en: 'It is the civic concierge and hyper-local directory for the Chartrons district in Bordeaux, run by the association. Residents, visitors and local businesses find 362 real addresses, mutual-aid posts and an AI assistant scoped to the neighborhood.',
        },
      },
      {
        id: 'association',
        q: {
          fr: 'Qui porte la plateforme et comment est-elle financée ?',
          en: 'Who runs the platform and how is it funded?',
        },
        a: {
          fr: 'L’association locale édite IDÉA CHARTRONS comme un bien commun. Les habitants consultent tout gratuitement. Le modèle économique repose uniquement sur l’adhésion « Premium Pro » des commerçants, sans publicité intrusive ni commission sur les ventes.',
          en: 'The local association publishes IDÉA CHARTRONS as a common good. Residents browse everything for free. The only revenue is the “Premium Pro” merchant membership — no intrusive ads, no commission on sales.',
        },
      },
      {
        id: 'account',
        q: {
          fr: 'Dois-je créer un compte pour utiliser le site ou publier une annonce ?',
          en: 'Do I need an account to use the site or to post?',
        },
        a: {
          fr: 'Non. La consultation est libre et anonyme. Pour la première annonce (don, petit boulot, entraide, vente ou offre pro), un code OTP à 4 chiffres est envoyé par e-mail ou SMS : cela vérifie que vous êtes joignable, sans créer de compte ni mot de passe.',
          en: 'No. Browsing is open and anonymous. For the first post (giveaway, small job, mutual aid, sale or pro offer), a 4-digit OTP is sent by email or SMS: it only checks that you can be reached, with no account and no password.',
        },
      },
      {
        id: 'free-contacts',
        q: {
          fr: 'Quels contacts des commerces puis-je utiliser gratuitement ?',
          en: 'Which business contacts can I use for free?',
        },
        a: {
          fr: 'Tous les commerces locaux ont un téléphone cliquable, un e-mail cliquable dès qu’il est connu, et leurs réseaux (Instagram, Facebook, WhatsApp). Le lien direct vers le site web, la mise en avant par le concierge IA et les modules d’action (Click & Collect, prise de RDV, ardoise) sont réservés aux membres Premium Pro.',
          en: 'Every local business has a clickable phone, a clickable email when known, and social links (Instagram, Facebook, WhatsApp). The direct website link, AI concierge priority and action modules (Click & Collect, booking, daily specials) are reserved for Premium Pro members.',
        },
      },
      {
        id: 'click-collect',
        q: {
          fr: 'Comment fonctionne le Click & Collect / Réservation express ?',
          en: 'How does Click & Collect / Express reservation work?',
        },
        a: {
          fr: 'Sur la fiche des commerçants Premium Pro disposant du bouton « Commander / Réserver », remplissez vos coordonnées et votre demande. Un récapitulatif pré-rempli s’ouvre directement sur votre téléphone (WhatsApp ou SMS) pour valider votre commande en direct avec le commerçant. Le règlement s’effectue sur place.',
          en: 'On Premium Pro listings with the “Order / Reserve” button, fill in your details and request. A pre-filled summary opens on your phone (WhatsApp or SMS) so you can confirm the order live with the merchant. Payment is made on site.',
        },
      },
      {
        id: 'anti-gaspi',
        q: {
          fr: 'C’est quoi la rubrique Anti-Gaspi, et pourquoi payer en ligne ?',
          en: 'What is the Anti-Waste section, and why pay online?',
        },
        a: {
          fr: 'Anti-Gaspi est un espace dédié aux commerces du quartier pour écouler invendus, surplus et produits à date courte — séparé du fil d’entraide entre voisins. Payer en ligne (CB) bloque l’offre : cela évite les réservations non honorées. Vous pouvez aussi appeler le commerce pour un retrait. Les tarifs étudiants (sacs surprise, viennoiseries de fin de journée) y sont clairement identifiés. Les offres expirées disparaissent automatiquement.',
          en: 'Anti-Waste is a dedicated space for neighborhood shops to sell unsold items, surplus and short-date products — kept apart from the neighbor-to-neighbor feed. Paying online (card) locks the offer, which prevents no-shows. You can also call the shop to reserve a pickup. Student-friendly deals (surprise bags, end-of-day pastries) are clearly labelled. Expired offers disappear automatically.',
        },
      },
      {
        id: 'reviews',
        q: {
          fr: 'Comment laisser un avis sur un commerce ?',
          en: 'How do I leave a review on a business?',
        },
        a: {
          fr: 'Sur la fiche détaillée du commerçant, vous pouvez attribuer une note (étoiles) et rédiger un commentaire pour partager votre expérience avec la communauté du quartier.',
          en: 'On the merchant’s detailed listing, you can give a star rating and write a comment to share your experience with the neighborhood community.',
        },
      },
    ],
  },
  {
    id: 'commercants',
    icon: '✨',
    label: { fr: 'Pour les Commerçants', en: 'For merchants' },
    kicker: { fr: 'Commerçants & Premium Pro', en: 'Merchants & Premium Pro' },
    intro: {
      fr: 'Chaque commerce est référencé gratuitement avec téléphone, e-mail et réseaux. L’adhésion Premium Pro, perçue par l’association, débloque le site web, la priorité IA et les modules d’action.',
      en: 'Every business is listed for free with phone, email and social links. Premium Pro, paid to the association, unlocks the website, AI priority and action modules.',
    },
    cta: {
      to: '/acteurs?referencer=1',
      label: { fr: 'Référencer mon commerce', en: 'List my business' },
    },
    items: [
      {
        id: 'listed',
        q: {
          fr: 'Mon établissement est-il déjà référencé sur la plateforme ?',
          en: 'Is my establishment already listed on the platform?',
        },
        a: {
          fr: 'La plateforme référence 362 adresses réelles du quartier, extraites d’OpenStreetMap puis enrichies. Vérifiez votre fiche via la barre de recherche (elle accepte les accents, le pluriel et des alias comme DAB, cash ou crèche). Si elle n’apparaît pas, demandez son ajout gratuit via « Référencer mon commerce ».',
          en: 'The platform lists 362 real neighborhood addresses, extracted from OpenStreetMap and then enriched. Check your listing in the search bar (it handles accents, plurals and aliases such as ATM, cash or nursery). If it is missing, request a free listing via “List my business”.',
        },
      },
      {
        id: 'free-vs-premium',
        q: {
          fr: 'Que comprend la fiche gratuite, et que réserve Premium Pro ?',
          en: 'What does the free listing include, and what is Premium Pro for?',
        },
        a: {
          fr: 'Gratuit pour tous : présence dans l’annuaire, téléphone cliquable, e-mail cliquable, liens Instagram / Facebook / WhatsApp, qualifications (diplômes, Maître artisan) et catalogue indicatif. Premium Pro, adhésion à l’association : lien direct vers votre site, priorité dans les recommandations du concierge IA, et modules d’action (Click & Collect, prise de rendez-vous, ardoise du jour). Aucune commission sur vos ventes.',
          en: 'Free for everyone: directory presence, clickable phone, clickable email, Instagram / Facebook / WhatsApp links, qualifications (degrees, Master Craftsman) and a sample catalog. Premium Pro, the association membership: a direct website link, priority in the AI concierge, and action modules (Click & Collect, booking, daily specials). No commission on your sales.',
        },
      },
      {
        id: 'commission',
        q: {
          fr: 'Y a-t-il une commission sur les ventes en Click & Collect ?',
          en: 'Is there a commission on Click & Collect sales?',
        },
        a: {
          fr: 'Aucune sur le Click & Collect habituel : les échanges se font directement entre vous et vos clients. Seule l’adhésion Premium Pro rémunère l’association. Exception : les paiements CB de la rubrique Anti-Gaspi incluent une petite commission plateforme (5 %), destinée à sécuriser le créneau et à financer l’outil.',
          en: 'None on regular Click & Collect: exchanges happen directly between you and your customers. Only the Premium Pro membership funds the association. Exception: card payments in the Anti-Waste section include a small platform commission (5%), which secures the slot and funds the tool.',
        },
      },
      {
        id: 'concierge-merchants',
        q: {
          fr: 'Le concierge IA peut-il recommander mon commerce ?',
          en: 'Can the AI concierge recommend my business?',
        },
        a: {
          fr: 'Oui. Le concierge puise uniquement dans l’annuaire des Chartrons. Les fiches Premium Pro sont priorisées dans le Top 5. Une fiche complète (catégorie, adresse, horaires, téléphone, qualifications) reste visible pour tous ; le lien site web et le Click & Collect ne s’affichent que pour Premium Pro.',
          en: 'Yes. The concierge only draws on the Chartrons directory. Premium Pro listings are prioritized in the Top 5. A complete listing (category, address, hours, phone, qualifications) stays visible for everyone; the website link and Click & Collect only appear for Premium Pro.',
        },
      },
      {
        id: 'anti-gaspi-merchant',
        q: {
          fr: 'Comment publier un invendu dans Anti-Gaspi ?',
          en: 'How do I post leftover stock in Anti-Waste?',
        },
        a: {
          fr: 'Ouvrez la rubrique Anti-Gaspi (bouton dédié, distinct des annonces habitants), indiquez le produit, le prix, un téléphone de retrait et une date/heure de fin obligatoires. L’offre disparaît toute seule à l’échéance. Le paiement CB bloque l’article pour le client ; l’appel téléphone reste possible pour un retrait local. Une commission de 5 % s’applique uniquement sur les paiements en ligne de cette rubrique.',
          en: 'Open the Anti-Waste section (a dedicated button, separate from resident listings), then add the product, price, a pickup phone number and a mandatory end date/time. The offer disappears on expiry. Card payment locks the item for the customer; a phone call remains available for local pickup. A 5% commission applies only to online payments in this section.',
        },
      },
    ],
  },
  {
    id: 'services',
    icon: '🛟',
    label: { fr: 'Services & Sécurité', en: 'Services & safety' },
    kicker: { fr: 'Concierge IA, patrimoine & urgences', en: 'AI concierge, heritage & emergencies' },
    intro: {
      fr: 'Le concierge multilingue, l’histoire des rues, les signalements Mairie / Police Municipale et les consignes d’urgence du quartier, réunis au même endroit.',
      en: 'The multilingual concierge, street history, City / Municipal Police reports and neighborhood emergency instructions, all in one place.',
    },
    cta: {
      to: '/conciergerie',
      label: { fr: 'Ouvrir le concierge IA', en: 'Open the AI concierge' },
    },
    items: [
      {
        id: 'concierge-ai',
        q: {
          fr: 'Comment fonctionne le concierge IA multilingue ?',
          en: 'How does the multilingual AI concierge work?',
        },
        a: {
          fr: 'Ouvrez la page Conciergerie et posez votre question en français, anglais, espagnol, allemand, italien, portugais ou néerlandais. La recherche tolère les accents (creche = crèche), le pluriel et des alias (DAB, bank, cash). Le concierge renvoie au plus 5 adresses du quartier, avec priorité aux membres Premium Pro, un budget estimé, et les actions directes seulement si le commerce est Premium Pro.',
          en: 'Open the Concierge page and ask in French, English, Spanish, German, Italian, Portuguese or Dutch. Search tolerates accents (creche = crèche), plurals and aliases (ATM, bank, cash). The concierge returns at most 5 neighborhood addresses, with Premium Pro priority, an estimated budget, and direct actions only for Premium Pro businesses.',
        },
      },
      {
        id: 'concierge-scope',
        q: {
          fr: 'Pourquoi le concierge ne répond-il qu’à propos des Chartrons ?',
          en: 'Why does the concierge only answer about the Chartrons?',
        },
        a: {
          fr: 'C’est un assistant hyper-local : il est conçu pour ne jamais inventer d’adresse et ne travaille que sur les données du quartier. Une question hors sujet est donc redirigée vers une piste locale — un commerce, une note patrimoine, un service municipal ou une urgence. Si l’IA n’est pas joignable, une sélection de secours est calculée directement dans votre navigateur, sans connexion.',
          en: 'It is a hyper-local assistant: it is built never to invent an address and works only on neighborhood data. An off-topic question is therefore redirected to a local lead — a shop, a heritage note, a city service or an emergency. If the AI is unreachable, a fallback selection is computed right in your browser, with no connection.',
        },
      },
      {
        id: 'street-history',
        q: {
          fr: 'Où trouver l’histoire des rues et les notes patrimoine ?',
          en: 'Where do I find street history and heritage notes?',
        },
        a: {
          fr: 'Demandez-le au concierge (« l’histoire de la rue Notre-Dame », « pourquoi les chais des Chartrons ? ») : une note patrimoine s’ajoute sous la réponse, avec l’époque, un résumé et une anecdote, plus un lien d’itinéraire vers la rue. Les rues documentées incluent la rue Notre-Dame, le cours Portal, la place du Marché des Chartrons, le quai des Chartrons, le cours Xavier Arnozan, la rue Borie, le cours de la Martinique et la rue Rode. La page Découvrir complète avec les parcours et les incontournables.',
          en: 'Ask the concierge (“the history of rue Notre-Dame”, “why the Chartrons wine cellars?”): a heritage note appears under the answer with the period, a summary, a piece of trivia and a walking link to the street. Documented streets include rue Notre-Dame, cours Portal, place du Marché des Chartrons, quai des Chartrons, cours Xavier Arnozan, rue Borie, cours de la Martinique and rue Rode. The Discover page adds walks and must-sees.',
        },
      },
      {
        id: 'civic-report',
        q: {
          fr: 'Comment signaler un problème à la Mairie ou à la Police Municipale ?',
          en: 'How do I report an issue to the City or the Municipal Police?',
        },
        a: {
          fr: 'Dans le Guide Pratique, section « Signalements Mairie & Police Municipale ». Choisissez le motif (propreté, voirie, éclairage, déchets, bruit, stationnement gênant, incivilité) et indiquez le lieu exact : un texte de signalement se génère, prêt à copier dans le formulaire de la Ville ou à lire au téléphone. Allô Mairie centralise les demandes du quartier au 05 56 10 20 30. En cas de danger immédiat, appelez le 17 ou le 112, jamais la Police Municipale.',
          en: 'In the Practical Guide, section “City & Municipal Police reports”. Pick the reason (cleanliness, roads, lighting, waste, noise, obstructive parking, antisocial behaviour) and give the exact location: a report text is generated, ready to paste into the city form or read out on the phone. Allô Mairie centralises neighborhood requests on 05 56 10 20 30. In case of immediate danger, call 17 or 112, never the Municipal Police.',
        },
      },
      {
        id: 'emergency',
        q: {
          fr: 'Où sont les numéros d’urgence et les consignes d’évacuation ?',
          en: 'Where are the emergency numbers and evacuation instructions?',
        },
        a: {
          fr: 'Toujours dans le Guide Pratique, section « Urgences & évacuation » : une barre d’appel en un geste (15 SAMU, 17 Police, 18 Pompiers, 112, 114 par SMS, Police Municipale, 3237 pharmacie de garde), les risques locaux (crue et submersion de la Garonne, vigilance météo, FR-Alert, fuite de gaz), les six consignes d’évacuation dans l’ordre, les points de regroupement du quartier avec itinéraire, et une fiche téléchargeable à garder hors ligne. Le jour d’une alerte, la consigne officielle (sirène, FR-Alert, agents municipaux) prime toujours.',
          en: 'Also in the Practical Guide, section “Emergencies & evacuation”: a one-tap call bar (15 ambulance, 17 police, 18 fire, 112, 114 by SMS, Municipal Police, 3237 on-duty pharmacy), local risks (Garonne flooding, weather warnings, FR-Alert, gas leaks), the six evacuation steps in order, neighborhood assembly points with directions, and a downloadable sheet to keep offline. During a real alert, the official instruction (siren, FR-Alert, municipal staff) always takes precedence.',
        },
      },
    ],
  },
];

export interface FaqComparisonRow {
  id: string;
  feature: LocaleText;
  free: LocaleText;
  premium: LocaleText;
}

export const FAQ_COMPARISON = {
  title: { fr: 'Fiche gratuite vs Premium Pro', en: 'Free listing vs Premium Pro' },
  subtitle: {
    fr: 'Tous les commerces locaux restent visibles. L’adhésion Premium Pro débloque le site web, la priorité IA et les modules d’action.',
    en: 'Every local business stays visible. Premium Pro unlocks the website, AI priority and action modules.',
  },
  freeHeader: {
    fr: 'Fiche gratuite (contacts cliquables & réseaux)',
    en: 'Free listing (clickable contacts & free socials)',
  },
  premiumHeader: {
    fr: 'Membre Premium Pro (site web, priorité IA & réservation)',
    en: 'Premium Pro member (website, AI priority & direct booking)',
  },
  rows: [
    {
      id: 'visibility',
      feature: { fr: 'Présence dans l’annuaire', en: 'Directory presence' },
      free: { fr: 'Oui', en: 'Yes' },
      premium: { fr: 'Oui, prioritaire', en: 'Yes, featured' },
    },
    {
      id: 'phone',
      feature: { fr: 'Téléphone cliquable', en: 'Clickable phone' },
      free: { fr: 'Oui', en: 'Yes' },
      premium: { fr: 'Oui', en: 'Yes' },
    },
    {
      id: 'email',
      feature: { fr: 'E-mail cliquable', en: 'Clickable email' },
      free: { fr: 'Oui', en: 'Yes' },
      premium: { fr: 'Oui', en: 'Yes' },
    },
    {
      id: 'social',
      feature: { fr: 'Réseaux (Instagram, Facebook, WhatsApp)', en: 'Socials (Instagram, Facebook, WhatsApp)' },
      free: { fr: 'Oui, gratuits', en: 'Yes, free' },
      premium: { fr: 'Oui, gratuits', en: 'Yes, free' },
    },
    {
      id: 'website',
      feature: { fr: 'Lien site web officiel', en: 'Official website link' },
      free: { fr: 'Non', en: 'No' },
      premium: { fr: 'Oui', en: 'Yes' },
    },
    {
      id: 'ai',
      feature: { fr: 'Priorité concierge IA', en: 'AI concierge priority' },
      free: { fr: 'Non', en: 'No' },
      premium: { fr: 'Oui, Top 5', en: 'Yes, Top 5' },
    },
    {
      id: 'actions',
      feature: { fr: 'Réservation / Click & Collect', en: 'Booking / Click & Collect' },
      free: { fr: 'Non', en: 'No' },
      premium: { fr: 'Selon l’activité', en: 'By activity' },
    },
  ] satisfies FaqComparisonRow[],
};
