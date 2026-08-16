import {
  ActeurLocalCategory,
  EventType,
  FideliteRegleMode,
  LocalRelaisRetraitStatus,
  PostStatus,
  PostType,
  PreferredLanguage,
  RelaisCreneauType,
  UserRole,
} from './enums.js';

export interface User {
  id: string;
  nom: string;
  email: string;
  role: UserRole;
  badgeVerifie: boolean;
  adresse: string;
  languePreferee: PreferredLanguage;
  pointsFidelite: number;
  qrCodeClient: string;
  createdAt: string;
  updatedAt: string;
}

export interface PostAnnonce {
  id: string;
  auteurId: string;
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
  userId: string;
  codeQrValidation: string;
  dateDepot: string;
  statutRetrait: LocalRelaisRetraitStatus;
  creneauDepotId: string | null;
  creneauRetraitId: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface ActeurLocal {
  id: string;
  userId: string;
  nomCommerce: string;
  categorie: ActeurLocalCategory;
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
  createdAt: string;
  updatedAt: string;
}

export interface AgendaEvenement {
  id: string;
  organisateurId: string;
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

export interface CarteFideliteScan {
  id: string;
  userId: string;
  commerceId: string;
  pointsGagnes: number;
  date: string;
}

export interface PrivilegeConsommation {
  id: string;
  userId: string;
  commerceId: string;
  offreVip: string;
  date: string;
}

export interface DatabaseSchema {
  users: User[];
  postsAnnonces: PostAnnonce[];
  localRelais: LocalRelais[];
  relaisCreneaux: RelaisCreneau[];
  relaisSettings: RelaisSettings[];
  acteursLocaux: ActeurLocal[];
  agendaEvenements: AgendaEvenement[];
  cartesFideliteScans: CarteFideliteScan[];
  privilegeConsommations: PrivilegeConsommation[];
}
