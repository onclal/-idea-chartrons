import type { LocaleText } from '../lib/locale';

export type FaqAudienceId = 'habitants' | 'commercants';

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
    fr: 'Deux espaces, deux publics : habitants et visiteurs d’un côté, commerçants et pros de l’autre. Avis, Click & Collect VIP, ardoise du jour et formule Pro, expliqués simplement.',
    en: 'Two spaces, two audiences: residents and visitors on one side, merchants and pros on the other. Reviews, VIP Click & Collect, daily specials and the Pro plan, explained simply.',
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
    ],
  },
];
