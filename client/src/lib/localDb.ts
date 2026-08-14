import {
  calculateScanPoints,
  createSeedData,
  getFideliteNiveau,
  getNextStatus,
  isCreneauAvailable,
  isVipUnlocked,
  LocalRelaisRetraitStatus,
  PostStatus,
  PostType,
  RelaisCreneauType,
  type DatabaseSchema,
  type FideliteNiveau,
  type PostAnnonce,
  type LocalRelais,
  type RelaisCreneau,
  type User,
} from '@idea-chartrons/shared';

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
        return JSON.parse(raw) as DatabaseSchema;
      }
    } catch {
      // corrupted storage — fall back to seed
    }
    const seed = createSeedData();
    this.persist(seed);
    return seed;
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

  // ── Users ──

  getUsers(): User[] {
    return this.getAll('users');
  }

  getUser(id: string): User {
    const user = this.getById('users', id);
    if (!user) throw new Error('User not found');
    return user;
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
  }): PostAnnonce {
    const now = new Date().toISOString();
    return this.create('postsAnnonces', {
      id: `post-${Date.now()}`,
      auteurId: data.auteurId,
      titre: data.titre,
      description: data.description,
      type: data.type,
      prix: data.prix,
      statut: PostStatus.Disponible,
      photos: data.photos,
      createdAt: now,
      updatedAt: now,
    });
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
    if (!acteur || acteur.qrCodeVitrine !== data.qrCode) {
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
