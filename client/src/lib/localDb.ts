import {
  ActeurLocalCategory,
  calculateScanPoints,
  createSeedData,
  generateQrVitrineCode,
  getFideliteNiveau,
  getNextStatus,
  isCreneauAvailable,
  isVipUnlocked,
  LocalRelaisRetraitStatus,
  PostStatus,
  PostType,
  RelaisCreneauType,
  type ActeurLocal,
  type AgendaEvenement,
  type DatabaseSchema,
  type EventType,
  type FideliteNiveau,
  type PostAnnonce,
  type PreferredLanguage,
  type LocalRelais,
  type RelaisCreneau,
  type User,
  type UserRole,
} from '@idea-chartrons/shared';

const LEGACY_ACTEUR_CATEGORIES: Record<string, ActeurLocalCategory> = {
  Brocanteur_Rue_Notre_Dame: ActeurLocalCategory.Brocanteur,
};

const DB_STORAGE_KEY = 'idea-chartrons-db';

class LocalDatabase {
  private data: DatabaseSchema;

  constructor() {
    this.data = this.loadFromStorage();
  }

  private loadFromStorage(): DatabaseSchema {
    try {
      const raw = localStorage.getItem(DB_STORAGE_KEY);
      if (raw) {
        return this.migrateActeurs(JSON.parse(raw) as DatabaseSchema);
      }
    } catch {
      // corrupted storage — fall back to seed
    }
    const seed = createSeedData();
    this.persist(seed);
    return seed;
  }

  private migrateActeurs(data: DatabaseSchema): DatabaseSchema {
    let changed = false;
    const acteursLocaux = (data.acteursLocaux ?? []).map((acteur) => {
      const nextCategory = LEGACY_ACTEUR_CATEGORIES[acteur.categorie] ?? acteur.categorie;
      const nextQr = acteur.qrCodeVitrine || null;
      if (nextCategory !== acteur.categorie || nextQr !== acteur.qrCodeVitrine) {
        changed = true;
      }
      return { ...acteur, categorie: nextCategory, qrCodeVitrine: nextQr };
    });

    const knownIds = new Set(acteursLocaux.map((acteur) => acteur.id));
    for (const seedActeur of createSeedData().acteursLocaux) {
      if (!knownIds.has(seedActeur.id)) {
        acteursLocaux.push(seedActeur);
        changed = true;
      }
    }

    const migrated = changed ? { ...data, acteursLocaux } : data;
    if (changed) this.persist(migrated);
    return migrated;
  }

  private persist(data: DatabaseSchema = this.data): void {
    this.data = data;
    localStorage.setItem(DB_STORAGE_KEY, JSON.stringify(data));
  }

  reset(): void {
    const seed = createSeedData();
    this.persist(seed);
  }

  getAll<K extends keyof DatabaseSchema>(collection: K): DatabaseSchema[K] {
    return this.data[collection];
  }

  getById<K extends keyof DatabaseSchema>(
    collection: K,
    id: string,
  ): DatabaseSchema[K][number] | undefined {
    return this.data[collection].find((item) => (item as { id: string }).id === id);
  }

  private create<K extends keyof DatabaseSchema>(
    collection: K,
    item: DatabaseSchema[K][number],
  ): DatabaseSchema[K][number] {
    (this.data[collection] as DatabaseSchema[K][number][]).push(item);
    this.persist();
    return item;
  }

  private update<K extends keyof DatabaseSchema>(
    collection: K,
    id: string,
    patch: Partial<DatabaseSchema[K][number]>,
  ): DatabaseSchema[K][number] | undefined {
    const items = this.data[collection] as DatabaseSchema[K][number][];
    const index = items.findIndex((item) => (item as { id: string }).id === id);
    if (index === -1) return undefined;
    items[index] = { ...items[index], ...patch, updatedAt: new Date().toISOString() };
    this.persist();
    return items[index];
  }

  private remove<K extends keyof DatabaseSchema>(
    collection: K,
    id: string,
  ): boolean {
    const items = this.data[collection] as DatabaseSchema[K][number][];
    const index = items.findIndex((item) => (item as { id: string }).id === id);
    if (index === -1) return false;
    items.splice(index, 1);
    this.persist();
    return true;
  }

  private releaseCreneau(creneauId: string | null | undefined): void {
    if (!creneauId) return;
    const creneau = this.getById('relaisCreneaux', creneauId);
    if (creneau && creneau.reserves > 0) {
      this.update('relaisCreneaux', creneauId, { reserves: creneau.reserves - 1 });
    }
  }

  // ── Users ──

  getUsers(): User[] {
    return this.getAll('users');
  }

  getUser(id: string): User {
    const user = this.getById('users', id);
    if (!user) throw new Error('User not found');
    return user;
  }

  createUser(data: {
    nom: string;
    email: string;
    role: UserRole;
    badgeVerifie: boolean;
    adresse: string;
    languePreferee: PreferredLanguage;
    pointsFidelite: number;
  }): User {
    const now = new Date().toISOString();
    return this.create('users', {
      id: `user-${Date.now()}`,
      nom: data.nom,
      email: data.email,
      role: data.role,
      badgeVerifie: data.badgeVerifie,
      adresse: data.adresse,
      languePreferee: data.languePreferee,
      pointsFidelite: data.pointsFidelite,
      createdAt: now,
      updatedAt: now,
    });
  }

  updateUser(userId: string, patch: Partial<Omit<User, 'id' | 'createdAt'>>): User {
    const updated = this.update('users', userId, patch);
    if (!updated) throw new Error('User not found');
    return updated;
  }

  // ── Posts ──

  getPosts(): PostAnnonce[] {
    return this.getAll('postsAnnonces');
  }

  createPost(data: {
    titre: string;
    description: string;
    type: PostType;
    prix: number | null;
    photos: string[];
    auteurId: string;
    statut?: PostStatus;
  }): PostAnnonce {
    const now = new Date().toISOString();
    return this.create('postsAnnonces', {
      id: `post-${Date.now()}`,
      auteurId: data.auteurId,
      titre: data.titre,
      description: data.description,
      type: data.type,
      prix: data.prix,
      statut: data.statut ?? PostStatus.Disponible,
      photos: data.photos,
      createdAt: now,
      updatedAt: now,
    });
  }

  updatePost(postId: string, patch: Partial<Omit<PostAnnonce, 'id' | 'createdAt'>>): PostAnnonce {
    const updated = this.update('postsAnnonces', postId, patch);
    if (!updated) throw new Error('Post not found');
    return updated;
  }

  deletePost(postId: string): void {
    const post = this.getById('postsAnnonces', postId);
    if (!post) throw new Error('Post not found');

    const relaisEntries = this.getAll('localRelais').filter((r) => r.postId === postId);
    for (const relais of relaisEntries) {
      this.releaseCreneau(relais.creneauDepotId);
      this.releaseCreneau(relais.creneauRetraitId);
      this.remove('localRelais', relais.id);
    }

    if (!this.remove('postsAnnonces', postId)) {
      throw new Error('Post not found');
    }
  }

  createActeur(data: {
    userId: string;
    nomCommerce: string;
    categorie: ActeurLocalCategory;
    description: string;
    adresse: string;
    photos: string[];
    offreVip: string | null;
    pointsRequisVip: number;
    activerFidelite?: boolean;
  }): ActeurLocal {
    const now = new Date().toISOString();
    return this.create('acteursLocaux', {
      id: `acteur-${Date.now()}`,
      userId: data.userId,
      nomCommerce: data.nomCommerce,
      categorie: data.categorie,
      description: data.description,
      adresse: data.adresse,
      photos: data.photos,
      offreVip: data.offreVip,
      pointsRequisVip: data.pointsRequisVip,
      qrCodeVitrine: data.activerFidelite ? generateQrVitrineCode(data.nomCommerce) : null,
      createdAt: now,
      updatedAt: now,
    });
  }

  generateQrVitrine(acteurId: string): ActeurLocal {
    const acteur = this.getById('acteursLocaux', acteurId);
    if (!acteur) throw new Error('Acteur not found');
    if (acteur.qrCodeVitrine) return acteur;
    const updated = this.update('acteursLocaux', acteurId, {
      qrCodeVitrine: generateQrVitrineCode(acteur.nomCommerce),
    });
    if (!updated) throw new Error('Acteur not found');
    return updated;
  }

  updateActeur(
    acteurId: string,
    patch: Partial<Omit<ActeurLocal, 'id' | 'createdAt' | 'qrCodeVitrine'>>,
  ): ActeurLocal {
    const updated = this.update('acteursLocaux', acteurId, patch);
    if (!updated) throw new Error('Acteur not found');
    return updated;
  }

  deleteActeur(acteurId: string): void {
    if (!this.getById('acteursLocaux', acteurId)) throw new Error('Acteur not found');

    this.data.cartesFideliteScans = this.data.cartesFideliteScans.filter(
      (scan) => scan.commerceId !== acteurId,
    );
    this.persist();

    if (!this.remove('acteursLocaux', acteurId)) {
      throw new Error('Acteur not found');
    }
  }

  createEvent(data: {
    organisateurId: string;
    titre: string;
    description: string;
    dateDebut: string;
    dateFin: string;
    image: string | null;
    type: EventType;
  }): AgendaEvenement {
    const now = new Date().toISOString();
    return this.create('agendaEvenements', {
      id: `event-${Date.now()}`,
      organisateurId: data.organisateurId,
      titre: data.titre,
      description: data.description,
      dateDebut: data.dateDebut,
      dateFin: data.dateFin,
      image: data.image,
      type: data.type,
      createdAt: now,
      updatedAt: now,
    });
  }

  updateEvent(
    eventId: string,
    patch: Partial<Omit<AgendaEvenement, 'id' | 'createdAt'>>,
  ): AgendaEvenement {
    const updated = this.update('agendaEvenements', eventId, patch);
    if (!updated) throw new Error('Event not found');
    return updated;
  }

  deleteEvent(eventId: string): void {
    if (!this.remove('agendaEvenements', eventId)) {
      throw new Error('Event not found');
    }
  }

  // ── Relais ──

  getRelais(): LocalRelais[] {
    return this.getAll('localRelais');
  }

  getRelaisByUser(userId: string): LocalRelais[] {
    return this.getAll('localRelais').filter((r) => r.userId === userId);
  }

  getCreneaux(type?: RelaisCreneauType): RelaisCreneau[] {
    let creneaux = this.getAll('relaisCreneaux');
    if (type) creneaux = creneaux.filter((c) => c.type === type);
    return creneaux.filter(isCreneauAvailable);
  }

  getAllCreneaux(): RelaisCreneau[] {
    return this.getAll('relaisCreneaux');
  }

  proposeDepotLocal(data: {
    postId: string;
    userId: string;
    creneauDepotId: string;
  }): LocalRelais {
    const post = this.getById('postsAnnonces', data.postId);
    if (!post) throw new Error('Post not found');

    const creneau = this.getById('relaisCreneaux', data.creneauDepotId);
    if (!creneau || creneau.type !== RelaisCreneauType.Depot || !isCreneauAvailable(creneau)) {
      throw new Error('Invalid or full depot slot');
    }

    const existing = this.getAll('localRelais').find((r) => r.postId === data.postId);
    if (existing) throw new Error('Depot already exists');

    const now = new Date().toISOString();
    const code = `QR-CHARTRONS-${String(Date.now()).slice(-6)}`;

    this.update('relaisCreneaux', data.creneauDepotId, { reserves: creneau.reserves + 1 });

    const relais = this.create('localRelais', {
      id: `relais-${Date.now()}`,
      postId: data.postId,
      userId: data.userId,
      codeQrValidation: code,
      dateDepot: now,
      statutRetrait: LocalRelaisRetraitStatus.EnAttente,
      creneauDepotId: data.creneauDepotId,
      creneauRetraitId: null,
      createdAt: now,
      updatedAt: now,
    });

    this.update('postsAnnonces', data.postId, { statut: PostStatus.DepotLocal });
    return relais;
  }

  reserverRetrait(relaisId: string, creneauRetraitId: string): LocalRelais {
    const relais = this.getById('localRelais', relaisId);
    if (!relais) throw new Error('Relais not found');
    if (relais.statutRetrait !== LocalRelaisRetraitStatus.DisponibleAuLocal) {
      throw new Error('Item not ready for pickup');
    }

    const creneau = this.getById('relaisCreneaux', creneauRetraitId);
    if (!creneau || creneau.type !== RelaisCreneauType.Retrait || !isCreneauAvailable(creneau)) {
      throw new Error('Invalid or full pickup slot');
    }

    this.update('relaisCreneaux', creneauRetraitId, { reserves: creneau.reserves + 1 });
    const updated = this.update('localRelais', relaisId, { creneauRetraitId });
    if (!updated) throw new Error('Relais not found');
    return updated;
  }

  avancerStatutRelais(relaisId: string): LocalRelais {
    const relais = this.getById('localRelais', relaisId);
    if (!relais) throw new Error('Relais not found');

    const next = getNextStatus(relais.statutRetrait);
    if (!next) throw new Error('No next status available');

    const updated = this.update('localRelais', relaisId, { statutRetrait: next });
    if (!updated) throw new Error('Relais not found');

    if (next === LocalRelaisRetraitStatus.Recupere) {
      this.update('postsAnnonces', relais.postId, { statut: PostStatus.Cloture });
    }

    return updated;
  }

  // ── Fidélité ──

  scanFidelite(data: { userId: string; commerceId: string; qrCode: string }) {
    const acteur = this.getById('acteursLocaux', data.commerceId);
    if (!acteur?.qrCodeVitrine || acteur.qrCodeVitrine !== data.qrCode) {
      throw new Error('Invalid QR code for this merchant');
    }

    const user = this.getUser(data.userId);
    const previousScans = this.getAll('cartesFideliteScans').filter((s) => s.userId === data.userId);
    const calculation = calculateScanPoints(acteur, user, previousScans);

    if (calculation.total === 0) {
      throw new Error('Already scanned this merchant today. Try again tomorrow.');
    }

    const now = new Date().toISOString();
    const scan = this.create('cartesFideliteScans', {
      id: `scan-${Date.now()}`,
      userId: data.userId,
      commerceId: data.commerceId,
      pointsGagnes: calculation.total,
      date: now,
    });

    const totalPoints = user.pointsFidelite + calculation.total;
    this.update('users', data.userId, { pointsFidelite: totalPoints });

    const newlyUnlocked =
      acteur.offreVip &&
      isVipUnlocked(totalPoints, acteur) &&
      !isVipUnlocked(user.pointsFidelite, acteur);

    return {
      scan,
      pointsGagnes: calculation.total,
      breakdown: calculation,
      totalPoints,
      commerce: acteur.nomCommerce,
      niveau: getFideliteNiveau(totalPoints),
      vipUnlocked: newlyUnlocked ? acteur.offreVip : null,
    };
  }

  getFideliteHistory(userId: string) {
    const scans = this.getAll('cartesFideliteScans')
      .filter((s) => s.userId === userId)
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    const acteurs = this.getAll('acteursLocaux');
    return scans.map((scan) => ({
      ...scan,
      commerceNom: acteurs.find((a) => a.id === scan.commerceId)?.nomCommerce ?? 'Commerce',
    }));
  }

  getVipStatus(userId: string): {
    points: number;
    niveau: FideliteNiveau;
    vipStatus: Array<{
      commerceId: string;
      commerceNom: string;
      offreVip: string | null;
      pointsRequis: number;
      unlocked: boolean;
      niveau: FideliteNiveau;
    }>;
  } {
    const user = this.getUser(userId);
    const acteurs = this.getAll('acteursLocaux');
    const vipStatus = acteurs
      .filter((a) => a.offreVip)
      .map((a) => ({
        commerceId: a.id,
        commerceNom: a.nomCommerce,
        offreVip: a.offreVip,
        pointsRequis: a.pointsRequisVip,
        unlocked: isVipUnlocked(user.pointsFidelite, a),
        niveau: getFideliteNiveau(user.pointsFidelite),
      }));

    return { points: user.pointsFidelite, niveau: getFideliteNiveau(user.pointsFidelite), vipStatus };
  }
}

export const localDb = new LocalDatabase();

const delay = (ms = 80) => new Promise((r) => setTimeout(r, ms));

export async function withDelay<T>(fn: () => T): Promise<T> {
  await delay();
  return fn();
}

export function resetLocalDb(): void {
  localDb.reset();
}
