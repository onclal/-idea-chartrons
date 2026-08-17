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
    fr: 'Trois espaces : habitants et visiteurs, commerçants et pros, puis les services du quartier — concierge IA multilingue, histoire des rues, signalements Mairie / Police Municipale et consignes d’urgence.',
    en: 'Three spaces: residents and visitors, merchants and pros, then neighborhood services — multilingual AI concierge, street history, City / Municipal Police reports and emergency instructions.',
  },
} as const satisfies Record<string, LocaleText>;

export const FAQ_AUDIENCES: FaqAudience[] = [
  {
    id: 'habitants',
    icon: '🏘️',
    label: { fr: 'Pour les Habitants', en: 'For residents' },
    kicker: { fr: 'Habitants & visiteurs', en: 'Residents & visitors' },
    intro: {
      fr: 'Annuaire local, avis du quartier et réservations express en mode invité — sans compte ni mot de passe.',
      en: 'Local directory, neighborhood reviews and express reservations in guest mode — no account, no password.',
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
          fr: 'C’est l’annuaire et guide local indépendant 100 % dédié aux commerces, artisans, services et acteurs du quartier des Chartrons à Bordeaux.',
          en: 'It is the independent local directory and guide, 100% dedicated to shops, craftspeople, services and local actors in the Chartrons district of Bordeaux.',
        },
      },
      {
        id: 'account',
        q: {
          fr: 'Dois-je créer un compte pour utiliser le site ou commander ?',
          en: 'Do I need an account to use the site or to order?',
        },
        a: {
          fr: 'Non, aucun compte ni mot de passe n’est requis. L’utilisation du site et les réservations en Click & Collect se font en mode invité, directement et gratuitement.',
          en: 'No — no account or password is required. Using the site and Click & Collect reservations work in guest mode, directly and for free.',
        },
      },
      {
        id: 'click-collect',
        q: {
          fr: 'Comment fonctionne le Click & Collect / Réservation express ?',
          en: 'How does Click & Collect / Express reservation work?',
        },
        a: {
          fr: 'Sur la fiche des commerçants VIP disposant du bouton « Commander / Réserver », remplissez vos coordonnées et votre demande. Un récapitulatif pré-rempli s’ouvre directement sur votre téléphone (WhatsApp ou SMS) pour valider votre commande en direct avec le commerçant. Le règlement s’effectue sur place.',
          en: 'On VIP merchant listings with the “Order / Reserve” button, fill in your details and request. A pre-filled summary opens on your phone (WhatsApp or SMS) so you can confirm the order live with the merchant. Payment is made on site.',
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
    kicker: { fr: 'Commerçants & Pros', en: 'Merchants & Pros' },
    intro: {
      fr: 'Présence gratuite dans l’annuaire, puis formule VIP Pro pour l’ardoise, le Click & Collect et la mise en avant — sans commission sur vos ventes.',
      en: 'Free presence in the directory, then VIP Pro for the daily slate, Click & Collect and featured placement — with 0% commission on your sales.',
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
          fr: 'La plateforme référence la majorité des professionnels des Chartrons. Vous pouvez vérifier votre fiche via la barre de recherche. Si votre établissement n’apparaît pas, vous pouvez demander son ajout gratuit via le bouton « Référencer mon commerce ».',
          en: 'The platform lists most Chartrons professionals. You can check your listing via the search bar. If your establishment does not appear, you can request a free listing via the “List my business” button.',
        },
      },
      {
        id: 'free-vs-vip',
        q: {
          fr: 'Quelle est la différence entre la formule Gratuite et la formule VIP Pro ?',
          en: 'What is the difference between the Free plan and VIP Pro?',
        },
        a: {
          fr: 'La formule gratuite assure votre présence dans l’annuaire local. La formule VIP Pro débloque les fonctionnalités à forte conversion : affichage de l’Ardoise / Menu du jour, bouton Click & Collect direct vers votre WhatsApp/SMS, badge VIP mis en avant et priorité dans la carte interactive.',
          en: 'The free plan ensures your presence in the local directory. VIP Pro unlocks high-conversion features: Daily Specials / slate display, a Click & Collect button straight to your WhatsApp/SMS, a featured VIP badge and priority on the interactive map.',
        },
      },
      {
        id: 'commission',
        q: {
          fr: 'Y a-t-il une commission sur les ventes en Click & Collect ?',
          en: 'Is there a commission on Click & Collect sales?',
        },
        a: {
          fr: 'Aucune. IDÉA CHARTRONS ne prend 0 % de commission sur vos ventes. Les échanges et paiements se font directement entre vous et vos clients.',
          en: 'None. IDÉA CHARTRONS takes 0% commission on your sales. Exchanges and payments happen directly between you and your customers.',
        },
      },
      {
        id: 'concierge-merchants',
        q: {
          fr: 'Le concierge IA peut-il recommander mon commerce ?',
          en: 'Can the AI concierge recommend my business?',
        },
        a: {
          fr: 'Oui. Le concierge puise uniquement dans l’annuaire du quartier : plus votre fiche est complète (catégorie, adresse, horaires, téléphone, ardoise du jour), plus elle a de chances d’apparaître dans le Top 5 et de déclencher une commande Click & Collect.',
          en: 'Yes. The concierge only draws on the neighborhood directory: the more complete your listing (category, address, opening hours, phone, daily specials), the more likely it appears in the Top 5 and triggers a Click & Collect order.',
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
          fr: 'Ouvrez la page Conciergerie et posez votre question en français, anglais, espagnol, allemand, italien, portugais ou néerlandais : la langue est détectée automatiquement et la réponse arrive dans la même langue. Vous pouvez aussi dicter votre demande au micro. Le concierge cherche exclusivement dans l’annuaire des Chartrons, renvoie au maximum 5 adresses avec la raison du choix, un budget estimé en euros, un bouton Click & Collect (WhatsApp ou SMS pré-rempli) et un itinéraire à pied Google Maps.',
          en: 'Open the Concierge page and ask in French, English, Spanish, German, Italian, Portuguese or Dutch: your language is detected automatically and the answer comes back in the same language. You can also dictate your request with the microphone. The concierge searches only the Chartrons directory and returns at most 5 addresses with the reason for each choice, an estimated budget in euros, a Click & Collect button (pre-filled WhatsApp or SMS) and a Google Maps walking route.',
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
