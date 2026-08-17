export enum UserRole {
  Habitant = 'Habitant',
  Commercant = 'Commerçant',
  BenevolRelais = 'Bénévol Relais',
  Admin = 'Admin',
}

export enum PreferredLanguage {
  FR = 'fr',
  EN = 'en',
}

export enum PostType {
  Don = 'Don',
  Vente = 'Vente',
  ServiceAide = 'Service_Aide',
  PetitBoulot = 'Petit_Boulot',
}

export enum PostStatus {
  Disponible = 'Disponible',
  Reserve = 'Réservé',
  DepotLocal = 'Dépôt_Local',
  Cloture = 'Clôturé',
}

export enum LocalRelaisRetraitStatus {
  EnAttente = 'En_Attente',
  DisponibleAuLocal = 'Disponible_Au_Local',
  Recupere = 'Récupéré',
}

export enum RelaisCreneauType {
  Depot = 'Depot',
  Retrait = 'Retrait',
}

export enum ActeurLocalCategory {
  RestaurationMenus = 'Restauration_Menus',
  BarsNightlife = 'Bars_Nightlife',
  SanteSoinsServices = 'Santé_Soins_Services',
  StartupsB2B = 'Startups_Tertiaire_B2B',
  CommercesArtisanat = 'Commerces_Proximité_Artisanat',
  TourismeConciergerie = 'Tourisme_Conciergeries',
}

export const DIRECTORY_CATEGORIES = [
  ActeurLocalCategory.RestaurationMenus,
  ActeurLocalCategory.BarsNightlife,
  ActeurLocalCategory.SanteSoinsServices,
  ActeurLocalCategory.StartupsB2B,
  ActeurLocalCategory.CommercesArtisanat,
  ActeurLocalCategory.TourismeConciergerie,
] as const;

export enum EventType {
  Brocante = 'Brocante',
  AnimationAsso = 'Animation_Asso',
  PromoFlash = 'Promo_Flash',
  Marche = 'Marché',
}

export enum FideliteNiveau {
  Bronze = 'Bronze',
  Argent = 'Argent',
  Or = 'Or',
}

export enum FideliteRegleMode {
  ChiffreAffaires = 'ca',
  Visite = 'visite',
  Forfait = 'forfait',
}
