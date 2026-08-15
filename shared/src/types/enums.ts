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
  Commercant = 'Commerçant',
  Artisan = 'Artisan',
  Brocanteur = 'Brocanteur',
  SanteServices = 'Santé_Services_Proximité',
  Liberal = 'Libéral',
  Association = 'Association',
}

export enum EventType {
  Brocante = 'Brocante',
  AnimationAsso = 'Animation_Asso',
  PromoFlash = 'Promo_Flash',
}

export enum FideliteNiveau {
  Bronze = 'Bronze',
  Argent = 'Argent',
  Or = 'Or',
}
