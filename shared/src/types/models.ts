import type { ChartronsSubcategory, ReportSubcategoryId } from '../data/taxonomy.js';
import {
  ActeurLocalCategory,
  ArdoiseStatus,
  CivicReportChannel,
  CivicReportStatus,
  EventType,
  FideliteRegleMode,
  LocalRelaisRetraitStatus,
  PostStatus,
  PostType,
  RelaisCreneauType,
} from './enums.js';

/**
 * Mode invité intégral : aucune entité utilisateur, aucun profil, aucune session.
 * Les contributions sont anonymes ; un simple nom d'affichage libre est optionnel,
 * et la propriété d'un contenu est mémorisée côté navigateur uniquement.
 */

export interface PostAnnonce {
  id: string;
  /** Nom d'affichage libre, facultatif. Aucun compte associé. */
  auteurNom: string | null;
  titre: string;
  description: string;
  type: PostType;
  prix: number | null;
  statut: PostStatus;
  photos: string[];
  telephone: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface RelaisHorairesPlage {
  heureDebut: string;
  heureFin: string;
}

export interface RelaisSettings {
  id: string;
  openingDays: number[];
  plages: RelaisHorairesPlage[];
  defaultCapacite: number;
  updatedAt?: string;
}

export interface PlatformSettings {
  id: string;
  transactionFee: number;
  updatedAt?: string;
}

export interface RelaisCreneau {
  id: string;
  date: string;
  heureDebut: string;
  heureFin: string;
  type: RelaisCreneauType;
  capacite: number;
  reserves: number;
  blocked?: boolean;
}

export interface LocalRelais {
  id: string;
  postId: string;
  /** Nom laissé au dépôt pour retrouver le colis, sans compte. */
  deposantNom: string | null;
  codeQrValidation: string;
  dateDepot: string;
  statutRetrait: LocalRelaisRetraitStatus;
  creneauDepotId: string | null;
  creneauRetraitId: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CommerceMenuItem {
  id: string;
  nom: string;
  description: string;
  prix: number;
}

export interface CommerceMenuSection {
  id: string;
  titre: string;
  items: CommerceMenuItem[];
}

export interface CommerceSocialLinks {
  instagram: string | null;
  facebook: string | null;
  whatsapp: string | null;
  website: string | null;
}

export interface ActeurLocal {
  id: string;
  nomCommerce: string;
  categorie: ActeurLocalCategory;
  /** Sous-catégorie unifiée (taxonomie stricte partagée avec les POI et le concierge IA). */
  subcategory: ChartronsSubcategory;
  description: string;
  adresse: string;
  telephone: string | null;
  latitude: number | null;
  longitude: number | null;
  photos: string[];
  offreVip: string | null;
  pointsRequisVip: number;
  qrCodeVitrine: string | null;
  regleFideliteMode: FideliteRegleMode;
  regleFideliteValeur: number;
  menu: CommerceMenuSection[] | null;
  appointmentUrl: string | null;
  rating: number | null;
  reviewsCount: number | null;
  openingHours: string | null;
  /** Spécialité fine affichée (texte libre). */
  specialite: string | null;
  pinCode: string | null;
  merchantEmail: string | null;
  socialLinks: CommerceSocialLinks;
  isMerchant: boolean;
  /** Commerce VIP : réseaux publics, Click & Collect et ardoise du jour. */
  isVip: boolean;
  dailyMenuImage?: string | null;
  dailyMenuText?: string | null;
  /** Modération de l'ardoise : seules les ardoises approuvées sont publiques. */
  dailyMenuStatus?: ArdoiseStatus;
  dailyMenuSubmittedAt?: string | null;
  phoneForOrders?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface AgendaEvenement {
  id: string;
  /** Nom d'organisateur libre, facultatif. */
  organisateurNom: string | null;
  titre: string;
  description: string;
  dateDebut: string;
  dateFin: string;
  image: string | null;
  type: EventType;
  lieu: string | null;
  latitude: number | null;
  longitude: number | null;
  createdAt: string;
  updatedAt: string;
}

/** Passage en caisse enregistré pour l'appareil courant (jamais pour une personne). */
export interface CarteFideliteScan {
  id: string;
  deviceId: string;
  commerceId: string;
  pointsGagnes: number;
  date: string;
}

export interface PrivilegeConsommation {
  id: string;
  deviceId: string;
  commerceId: string;
  offreVip: string;
  date: string;
}

/** Signalement citoyen, en attente de relecture avant transmission au service compétent. */
export interface CivicReport {
  id: string;
  subcategoryId: ReportSubcategoryId;
  channel: CivicReportChannel;
  lieu: string;
  details: string;
  statut: CivicReportStatus;
  /** Langue de rédaction, utile pour la transmission. */
  langue: string;
  createdAt: string;
  updatedAt: string;
}

export interface DatabaseSchema {
  postsAnnonces: PostAnnonce[];
  localRelais: LocalRelais[];
  relaisCreneaux: RelaisCreneau[];
  relaisSettings: RelaisSettings[];
  platformSettings: PlatformSettings[];
  acteursLocaux: ActeurLocal[];
  agendaEvenements: AgendaEvenement[];
  cartesFideliteScans: CarteFideliteScan[];
  privilegeConsommations: PrivilegeConsommation[];
  civicReports: CivicReport[];
}
