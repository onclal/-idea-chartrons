import {
  ActeurLocalCategory,
  calculateAwardPoints,
  calculateScanPoints,
  CHARTRONS_MAP_CENTER,
  computeTourDeControle,
  createSeedData,
  createUpcomingMarcheChartronsEvents,
  DEFAULT_MERCHANT_PIN,
  defaultMerchantEmail,
  defaultRegleForCategory,
  emptySocialLinks,
  findUserByClientToken,
  generateQrClientCode,
  generateQrVitrineCode,
  getActeurFideliteRegle,
  getFideliteNiveau,
  getCreneauReserves,
  getNextStatus,
  isCreneauBookable,
  isVipUnlocked,
  normalizeRelaisSettings,
  normalizePlatformSettings,
  normalizePinCode,
  normalizeSocialLinks,
  SEED_CATALOG_VERSION,
  socialLinksEqual,
  LocalRelaisRetraitStatus,
  normalizeRelaisCreneauType,
  PostStatus,
  PostType,
  RelaisCreneauType,
  syncRelaisCreneauxWindow,
  slotFromId,
  type ActeurLocal,
  type AgendaEvenement,
  type DatabaseSchema,
  type EventType,
  type FideliteNiveau,
  type PostAnnonce,
  type PreferredLanguage,
  type LocalRelais,
  type RelaisCreneau,
  type RelaisSettings,
  type PlatformSettings,
  type User,
  type UserRole,
} from '@idea-chartrons/shared';
import { DB_STORAGE_KEY, SEED_CATALOG_KEY, isQuotaError, purgeObsoleteLocalStorage, writeLocalStorage } from './storage';

const VALID_ACTEUR_CATEGORIES = new Set<string>(Object.values(ActeurLocalCategory));

const LEGACY_ACTEUR_CATEGORIES: Record<string, ActeurLocalCategory> = {
  Brocanteur_Rue_Notre_Dame: ActeurLocalCategory.CommercesArtisanat,
  Brocanteur: ActeurLocalCategory.CommercesArtisanat,
  Commerçant: ActeurLocalCategory.CommercesArtisanat,
  Artisan: ActeurLocalCategory.CommercesArtisanat,
  Santé_Services_Proximité: ActeurLocalCategory.SanteSoinsServices,
  Libéral: ActeurLocalCategory.StartupsB2B,
  Association: ActeurLocalCategory.StartupsB2B,
};

function isHeavyPhoto(url: string): boolean {
  return url.startsWith('data:');
}

function stripHeavyPhotos(photos: string[] | undefined, aggressive: boolean): string[] {
  const list = photos ?? [];
  if (aggressive) return [];
  return list.filter((photo) => photo && !isHeavyPhoto(photo)).slice(0, 2);
}

function compactSchema(data: DatabaseSchema, aggressive = false): DatabaseSchema {
  const marcheCutoff = Date.now() - 2 * 86400000;
  return {
    ...data,
    postsAnnonces: (data.postsAnnonces ?? []).map((post) => ({
      ...post,
      photos: stripHeavyPhotos(post.photos, aggressive),
    })),
    acteursLocaux: (data.acteursLocaux ?? []).map((acteur) => ({
      ...acteur,
      photos: stripHeavyPhotos(acteur.photos, aggressive),
    })),
    agendaEvenements: (data.agendaEvenements ?? [])
      .filter((event) => {
        if (!event.id.startsWith('event-marche-chartrons-')) return true;
        return new Date(event.dateFin).getTime() >= marcheCutoff;
      })
      .map((event) => (aggressive ? { ...event, image: null } : event)),
    cartesFideliteScans: (data.cartesFideliteScans ?? []).slice(-80),
    privilegeConsommations: (data.privilegeConsommations ?? []).slice(-80),
    localRelais: aggressive
      ? (data.localRelais ?? []).filter(
          (relais) => relais.statutRetrait !== LocalRelaisRetraitStatus.Recupere,
        )
      : (data.localRelais ?? []),
  };
}

function resolveRelaisSettings(data: DatabaseSchema): RelaisSettings {
  return normalizeRelaisSettings(data.relaisSettings?.[0]);
}

function resolvePlatformSettings(data: DatabaseSchema): PlatformSettings {
  return normalizePlatformSettings(data.platformSettings?.[0]);
}

function mergeCatalogActeur(current: ActeurLocal | undefined, seedActeur: ActeurLocal): ActeurLocal {
  if (!current) return seedActeur;
  return {
    ...seedActeur,
    ...current,
    nomCommerce: seedActeur.nomCommerce,
    description: seedActeur.description,
    adresse: seedActeur.adresse,
    categorie: seedActeur.categorie,
    latitude: seedActeur.latitude,
    longitude: seedActeur.longitude,
    photos: current.photos?.length ? current.photos : seedActeur.photos,
    specialite: current.specialite ?? seedActeur.specialite,
    rating: current.rating ?? seedActeur.rating,
    reviewsCount: current.reviewsCount ?? seedActeur.reviewsCount,
    openingHours: current.openingHours ?? seedActeur.openingHours,
    telephone: current.telephone ?? seedActeur.telephone,
    isMerchant: seedActeur.isMerchant,
    pinCode: current.pinCode ?? seedActeur.pinCode,
    merchantEmail: current.merchantEmail ?? seedActeur.merchantEmail,
    socialLinks: current.socialLinks ?? seedActeur.socialLinks,
    menu: current.menu ?? seedActeur.menu,
    appointmentUrl: current.appointmentUrl ?? seedActeur.appointmentUrl,
    qrCodeVitrine: current.qrCodeVitrine ?? seedActeur.qrCodeVitrine,
  };
}

function syncCatalogActeurs(existing: ActeurLocal[], seedActeurs: ActeurLocal[]): ActeurLocal[] {
  const existingById = new Map(existing.map((acteur) => [acteur.id, acteur]));
  const seedIds = new Set(seedActeurs.map((acteur) => acteur.id));
  const synced = seedActeurs.map((seedActeur) => mergeCatalogActeur(existingById.get(seedActeur.id), seedActeur));
  const custom = existing.filter((acteur) => !seedIds.has(acteur.id));
  return [...synced, ...custom];
}

function syncSlots(data: DatabaseSchema, from = new Date()): RelaisCreneau[] {
  return syncRelaisCreneauxWindow(
    data.relaisCreneaux ?? [],
    data.localRelais ?? [],
    from,
    resolveRelaisSettings(data),
  );
}

function readSeedCatalogVersion(): number {
  try {
    const raw = localStorage.getItem(SEED_CATALOG_KEY);
    const parsed = Number(raw);
    return Number.isFinite(parsed) ? parsed : 0;
  } catch {
    return 0;
  }
}

function writeSeedCatalogVersion(version: number): void {
  try {
    localStorage.setItem(SEED_CATALOG_KEY, String(version));
  } catch {
    // quota — the next launch will retry the catalog upsert
  }
}

function todayLocalYmd(): string {
  const now = new Date();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${now.getFullYear()}-${month}-${day}`;
}

class LocalDatabase {
  private data: DatabaseSchema;
  private skipPersist = 0;

  constructor() {
    this.data = this.loadFromStorage();
  }

  private loadFromStorage(): DatabaseSchema {
    try {
      const raw = localStorage.getItem(DB_STORAGE_KEY);
      if (raw) {
        return this.migrateSchema(JSON.parse(raw) as DatabaseSchema);
      }
    } catch {
      // corrupted storage — fall back to seed
    }
    const seed = createSeedData();
    try {
      this.persist(seed);
      writeSeedCatalogVersion(SEED_CATALOG_VERSION);
    } catch {
      this.data = seed;
    }
    return seed;
  }

  private migrateSchema(data: DatabaseSchema): DatabaseSchema {
    let changed = false;
    const seed = createSeedData();

    const users = (data.users ?? []).map((user) => {
      const nextQr = user.qrCodeClient || generateQrClientCode(user.id);
      if (nextQr !== user.qrCodeClient) changed = true;
      return { ...user, qrCodeClient: nextQr };
    });

    const catalogStale = readSeedCatalogVersion() < SEED_CATALOG_VERSION;
    let acteursLocaux: ActeurLocal[] = (data.acteursLocaux ?? []).map((acteur) => {
      const seedMatch = seed.acteursLocaux.find((item) => item.id === acteur.id);
      const mappedLegacy = LEGACY_ACTEUR_CATEGORIES[acteur.categorie];
      const nextCategory = VALID_ACTEUR_CATEGORIES.has(acteur.categorie)
        ? acteur.categorie
        : (seedMatch?.categorie ?? mappedLegacy ?? ActeurLocalCategory.CommercesArtisanat);
      const nextMerchant = seedMatch?.isMerchant ?? acteur.isMerchant ?? true;
      const nextQr = acteur.qrCodeVitrine || null;
      const nextLat = acteur.latitude ?? seedMatch?.latitude ?? null;
      const nextLng = acteur.longitude ?? seedMatch?.longitude ?? null;
      const nextTel = acteur.telephone ?? seedMatch?.telephone ?? null;
      const nextMenu = acteur.menu ?? seedMatch?.menu ?? null;
      const nextAppointment = acteur.appointmentUrl ?? seedMatch?.appointmentUrl ?? null;
      const nextRating = acteur.rating ?? seedMatch?.rating ?? null;
      const nextReviews = acteur.reviewsCount ?? seedMatch?.reviewsCount ?? null;
      const nextHours = acteur.openingHours ?? seedMatch?.openingHours ?? null;
      const nextSpecialite = acteur.specialite ?? seedMatch?.specialite ?? null;
      const nextPhotos = acteur.photos?.length ? acteur.photos : (seedMatch?.photos ?? []);
      const nextPin =
        normalizePinCode(acteur.pinCode) ??
        normalizePinCode(seedMatch?.pinCode) ??
        (nextMerchant ? DEFAULT_MERCHANT_PIN : null);
      const nextMerchantEmail =
        acteur.merchantEmail?.trim() ||
        seedMatch?.merchantEmail ||
        (nextMerchant ? defaultMerchantEmail(acteur.userId) : null);
      const nextSocial = acteur.socialLinks
        ? normalizeSocialLinks(acteur.socialLinks)
        : normalizeSocialLinks(seedMatch?.socialLinks ?? emptySocialLinks());
      const fallbackRule = seedMatch
        ? { mode: seedMatch.regleFideliteMode, valeur: seedMatch.regleFideliteValeur }
        : defaultRegleForCategory(nextCategory as ActeurLocalCategory);
      const nextMode = acteur.regleFideliteMode ?? fallbackRule.mode;
      const nextValeur = acteur.regleFideliteValeur ?? fallbackRule.valeur;
      if (
        nextCategory !== acteur.categorie ||
        nextQr !== acteur.qrCodeVitrine ||
        nextLat !== acteur.latitude ||
        nextLng !== acteur.longitude ||
        nextTel !== acteur.telephone ||
        nextMenu !== acteur.menu ||
        nextAppointment !== acteur.appointmentUrl ||
        nextRating !== acteur.rating ||
        nextReviews !== acteur.reviewsCount ||
        nextHours !== acteur.openingHours ||
        nextSpecialite !== acteur.specialite ||
        nextPin !== acteur.pinCode ||
        nextMerchantEmail !== acteur.merchantEmail ||
        nextMerchant !== acteur.isMerchant ||
        nextPhotos.length !== (acteur.photos?.length ?? 0) ||
        !socialLinksEqual(nextSocial, acteur.socialLinks) ||
        nextMode !== acteur.regleFideliteMode ||
        nextValeur !== acteur.regleFideliteValeur
      ) {
        changed = true;
      }
      return {
        ...acteur,
        categorie: nextCategory as ActeurLocalCategory,
        qrCodeVitrine: nextQr,
        latitude: nextLat,
        longitude: nextLng,
        telephone: nextTel,
        photos: nextPhotos,
        menu: nextMenu,
        appointmentUrl: nextAppointment,
        rating: nextRating,
        reviewsCount: nextReviews,
        openingHours: nextHours,
        specialite: nextSpecialite,
        pinCode: nextPin,
        merchantEmail: nextMerchantEmail,
        socialLinks: nextSocial,
        isMerchant: nextMerchant,
        regleFideliteMode: nextMode,
        regleFideliteValeur: nextValeur,
      };
    });

    if (catalogStale) {
      acteursLocaux = syncCatalogActeurs(acteursLocaux, seed.acteursLocaux);
      changed = true;
    } else {
      const knownActeurIds = new Set(acteursLocaux.map((acteur) => acteur.id));
      for (const seedActeur of seed.acteursLocaux) {
        if (!knownActeurIds.has(seedActeur.id)) {
          acteursLocaux.push(seedActeur);
          changed = true;
        }
      }
    }

    const agendaEvenements = (data.agendaEvenements ?? []).map((event) => {
      const seedMatch = seed.agendaEvenements.find((item) => item.id === event.id);
      const nextLieu = event.lieu ?? seedMatch?.lieu ?? null;
      const nextLat = event.latitude ?? seedMatch?.latitude ?? null;
      const nextLng = event.longitude ?? seedMatch?.longitude ?? null;
      if (nextLieu !== event.lieu || nextLat !== event.latitude || nextLng !== event.longitude) {
        changed = true;
      }
      return { ...event, lieu: nextLieu, latitude: nextLat, longitude: nextLng };
    });

    const knownEventIds = new Set(agendaEvenements.map((event) => event.id));
    for (const seedEvent of seed.agendaEvenements) {
      if (!knownEventIds.has(seedEvent.id)) {
        agendaEvenements.push(seedEvent);
        knownEventIds.add(seedEvent.id);
        changed = true;
      }
    }

    for (const marche of createUpcomingMarcheChartronsEvents('user-1', new Date().toISOString())) {
      if (!knownEventIds.has(marche.id)) {
        agendaEvenements.push(marche);
        knownEventIds.add(marche.id);
        changed = true;
      }
    }

    const postsAnnonces = (data.postsAnnonces ?? []).map((post) => {
      const seedMatch = seed.postsAnnonces.find((item) => item.id === post.id);
      const telephone = post.telephone ?? seedMatch?.telephone ?? null;
      if (telephone !== post.telephone) changed = true;
      return { ...post, telephone };
    });

    const knownPostIds = new Set(postsAnnonces.map((post) => post.id));
    for (const seedPost of seed.postsAnnonces) {
      if (!knownPostIds.has(seedPost.id)) {
        postsAnnonces.push(seedPost);
        knownPostIds.add(seedPost.id);
        changed = true;
      }
    }

    const marcheCutoff = Date.now() - 2 * 86400000;
    const prunedEvents = agendaEvenements.filter((event) => {
      if (!event.id.startsWith('event-marche-chartrons-')) return true;
      return new Date(event.dateFin).getTime() >= marcheCutoff;
    });
    if (prunedEvents.length !== agendaEvenements.length) changed = true;

    const localRelais = data.localRelais ?? [];
    const relaisSettings = [resolveRelaisSettings(data)];
    if (!data.relaisSettings?.[0]) changed = true;
    const platformSettings = [resolvePlatformSettings(data)];
    if (!data.platformSettings?.[0]) changed = true;
    const relaisCreneaux = syncRelaisCreneauxWindow(
      data.relaisCreneaux ?? [],
      localRelais,
      new Date(),
      relaisSettings[0],
    );
    if (JSON.stringify(relaisCreneaux) !== JSON.stringify(data.relaisCreneaux ?? [])) {
      changed = true;
    }

    const privilegeConsommations = [...(data.privilegeConsommations ?? [])];
    const knownPrivilegeIds = new Set(privilegeConsommations.map((item) => item.id));
    for (const seedPrivilege of seed.privilegeConsommations) {
      if (!knownPrivilegeIds.has(seedPrivilege.id)) {
        privilegeConsommations.push(seedPrivilege);
        knownPrivilegeIds.add(seedPrivilege.id);
        changed = true;
      }
    }

    const migrated = {
      ...data,
      users,
      acteursLocaux,
      agendaEvenements: prunedEvents,
      postsAnnonces,
      relaisCreneaux,
      relaisSettings,
      platformSettings,
      localRelais,
      privilegeConsommations,
    };
    if (changed || catalogStale) this.persist(migrated);
    if (catalogStale || readSeedCatalogVersion() !== SEED_CATALOG_VERSION) {
      writeSeedCatalogVersion(SEED_CATALOG_VERSION);
    }
    return changed || catalogStale ? migrated : { ...data, relaisCreneaux, platformSettings };
  }

  private persist(data: DatabaseSchema = this.data): void {
    if (this.skipPersist > 0) {
      this.data = data;
      return;
    }

    const write = (payload: DatabaseSchema) => {
      writeLocalStorage(DB_STORAGE_KEY, JSON.stringify(payload));
      this.data = payload;
    };

    let next = data;
    const serialized = JSON.stringify(next);
    if (serialized.length > 1_400_000) {
      next = compactSchema(next, serialized.length > 2_400_000);
      next = {
        ...next,
        relaisCreneaux: syncSlots(next),
      };
    }

    try {
      write(next);
      return;
    } catch (error) {
      if (!isQuotaError(error) && (error as Error).message !== 'STORAGE_QUOTA') throw error;
    }

    purgeObsoleteLocalStorage();
    let compacted = compactSchema(next, false);
    compacted = {
      ...compacted,
      relaisCreneaux: syncSlots(compacted),
    };
    try {
      localStorage.removeItem(DB_STORAGE_KEY);
      write(compacted);
      return;
    } catch (error) {
      if (!isQuotaError(error)) throw error;
    }

    purgeObsoleteLocalStorage({ aggressive: true });
    compacted = compactSchema(compacted, true);
    compacted = {
      ...compacted,
      relaisCreneaux: syncSlots(compacted),
    };
    try {
      localStorage.removeItem(DB_STORAGE_KEY);
      write(compacted);
    } catch (error) {
      const raw = localStorage.getItem(DB_STORAGE_KEY);
      if (raw) {
        try {
          this.data = JSON.parse(raw) as DatabaseSchema;
        } catch {
          this.data = data;
        }
      } else {
        this.data = compacted;
      }
      throw new Error('STORAGE_QUOTA');
    }
  }

  private withSinglePersist<T>(fn: () => T): T {
    this.skipPersist += 1;
    try {
      const result = fn();
      this.skipPersist = Math.max(0, this.skipPersist - 1);
      this.persist();
      return result;
    } catch (error) {
      this.skipPersist = Math.max(0, this.skipPersist - 1);
      throw error;
    }
  }

  private refreshCreneaux(): RelaisCreneau[] {
    const next = syncSlots(this.data);
    this.data = { ...this.data, relaisSettings: [resolveRelaisSettings(this.data)], relaisCreneaux: next };
    return next;
  }

  private ensureSlot(creneauId: string, expectedType: RelaisCreneauType): RelaisCreneau | undefined {
    this.refreshCreneaux();
    let creneau = this.getById('relaisCreneaux', creneauId);
    if (!creneau) {
      const created = slotFromId(creneauId);
      if (created) {
        this.data = {
          ...this.data,
          relaisCreneaux: [...this.data.relaisCreneaux, created],
        };
        creneau = created;
      }
    }
    if (!creneau) return undefined;
    if (normalizeRelaisCreneauType(creneau.type) !== expectedType) return undefined;
    return creneau;
  }

  reset(): void {
    const seed = createSeedData();
    this.persist(seed);
    writeSeedCatalogVersion(SEED_CATALOG_VERSION);
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
    const id = `user-${Date.now()}`;
    return this.create('users', {
      id,
      nom: data.nom,
      email: data.email,
      role: data.role,
      badgeVerifie: data.badgeVerifie,
      adresse: data.adresse,
      languePreferee: data.languePreferee,
      pointsFidelite: data.pointsFidelite,
      qrCodeClient: generateQrClientCode(id),
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
    telephone?: string | null;
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
      telephone: data.telephone?.trim() || null,
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
    latitude?: number | null;
    longitude?: number | null;
    telephone?: string | null;
    menu?: ActeurLocal['menu'];
    appointmentUrl?: string | null;
  }): ActeurLocal {
    const now = new Date().toISOString();
    const rule = defaultRegleForCategory(data.categorie);
    return this.create('acteursLocaux', {
      id: `acteur-${Date.now()}`,
      userId: data.userId,
      nomCommerce: data.nomCommerce,
      categorie: data.categorie,
      description: data.description,
      adresse: data.adresse,
      telephone: data.telephone?.trim() || null,
      photos: data.photos,
      offreVip: data.offreVip,
      pointsRequisVip: data.pointsRequisVip,
      qrCodeVitrine: data.activerFidelite ? generateQrVitrineCode(data.nomCommerce) : null,
      latitude: data.latitude ?? CHARTRONS_MAP_CENTER.latitude,
      longitude: data.longitude ?? CHARTRONS_MAP_CENTER.longitude,
      regleFideliteMode: rule.mode,
      regleFideliteValeur: rule.valeur,
      menu: data.menu ?? null,
      appointmentUrl: data.appointmentUrl?.trim() || null,
      rating: null,
      reviewsCount: null,
      openingHours: null,
      specialite: null,
      pinCode: DEFAULT_MERCHANT_PIN,
      merchantEmail: this.getById('users', data.userId)?.email ?? defaultMerchantEmail(data.userId),
      socialLinks: emptySocialLinks(),
      isMerchant: true,
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
    this.data.privilegeConsommations = (this.data.privilegeConsommations ?? []).filter(
      (item) => item.commerceId !== acteurId,
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
    lieu?: string | null;
    latitude?: number | null;
    longitude?: number | null;
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
      lieu: data.lieu ?? null,
      latitude: data.latitude ?? CHARTRONS_MAP_CENTER.latitude,
      longitude: data.longitude ?? CHARTRONS_MAP_CENTER.longitude,
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

  getRelaisSettings(): RelaisSettings {
    return resolveRelaisSettings(this.data);
  }

  getPlatformSettings(): PlatformSettings {
    return resolvePlatformSettings(this.data);
  }

  updatePlatformSettings(patch: Partial<Omit<PlatformSettings, 'id'>>): PlatformSettings {
    const next = normalizePlatformSettings({ ...this.getPlatformSettings(), ...patch });
    this.data = { ...this.data, platformSettings: [next] };
    this.persist();
    return this.getPlatformSettings();
  }

  updateRelaisSettings(patch: Partial<Omit<RelaisSettings, 'id'>>): RelaisSettings {
    const next = normalizeRelaisSettings({ ...this.getRelaisSettings(), ...patch });
    this.data = { ...this.data, relaisSettings: [next] };
    this.refreshCreneaux();
    this.persist();
    return this.getRelaisSettings();
  }

  setCreneauBlocked(creneauId: string, blocked: boolean): RelaisCreneau {
    this.refreshCreneaux();
    const creneau = this.getById('relaisCreneaux', creneauId);
    if (!creneau) throw new Error('Slot not found');
    const updated = this.update('relaisCreneaux', creneauId, { blocked });
    if (!updated) throw new Error('Slot not found');
    return updated;
  }

  getCreneaux(type?: RelaisCreneauType): RelaisCreneau[] {
    this.refreshCreneaux();
    const today = todayLocalYmd();
    const settings = this.getRelaisSettings();
    const expected = type ? normalizeRelaisCreneauType(type) : null;
    return this.getAll('relaisCreneaux').filter((creneau) => {
      const slotType = normalizeRelaisCreneauType(creneau.type);
      const matchesType = expected == null || slotType === expected;
      return matchesType && creneau.date >= today && isCreneauBookable(creneau, settings);
    });
  }

  getAllCreneaux(): RelaisCreneau[] {
    return this.refreshCreneaux();
  }

  proposeDepotLocal(data: {
    postId: string;
    userId: string;
    creneauDepotId: string;
  }): LocalRelais {
    try {
      return this.withSinglePersist(() => this.commitDepotLocal(data));
    } catch (error) {
      if (error instanceof Error && error.message === 'STORAGE_QUOTA') {
        purgeObsoleteLocalStorage({ aggressive: true });
        this.data = compactSchema(this.data, true);
        this.refreshCreneaux();
        const already = this.getAll('localRelais').find((r) => r.postId === data.postId);
        if (already) {
          this.persist();
          return already;
        }
        return this.withSinglePersist(() => this.commitDepotLocal(data));
      }
      throw error;
    }
  }

  private commitDepotLocal(data: {
    postId: string;
    userId: string;
    creneauDepotId: string;
  }): LocalRelais {
    const post = this.getById('postsAnnonces', data.postId);
    if (!post) throw new Error('Post not found');

    const existing = this.getAll('localRelais').find((r) => r.postId === data.postId);
    if (existing) throw new Error('Depot already exists');

    this.refreshCreneaux();
    const creneau = this.ensureSlot(data.creneauDepotId, RelaisCreneauType.Depot);
    if (!creneau || !isCreneauBookable(creneau, this.getRelaisSettings())) {
      throw new Error('Invalid or full depot slot');
    }

    const now = new Date().toISOString();
    const code = `QR-CHARTRONS-${String(Date.now()).slice(-6)}`;

    this.update('relaisCreneaux', data.creneauDepotId, { reserves: getCreneauReserves(creneau) + 1 });

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
    try {
      return this.withSinglePersist(() => this.commitRetrait(relaisId, creneauRetraitId));
    } catch (error) {
      if (error instanceof Error && error.message === 'STORAGE_QUOTA') {
        purgeObsoleteLocalStorage({ aggressive: true });
        this.data = compactSchema(this.data, true);
        this.refreshCreneaux();
        const current = this.getById('localRelais', relaisId);
        if (current?.creneauRetraitId === creneauRetraitId) {
          this.persist();
          return current;
        }
        return this.withSinglePersist(() => this.commitRetrait(relaisId, creneauRetraitId));
      }
      throw error;
    }
  }

  private commitRetrait(relaisId: string, creneauRetraitId: string): LocalRelais {
    const relais = this.getById('localRelais', relaisId);
    if (!relais) throw new Error('Relais not found');
    if (relais.statutRetrait !== LocalRelaisRetraitStatus.DisponibleAuLocal) {
      throw new Error('Item not ready for pickup');
    }

    this.refreshCreneaux();
    const creneau = this.ensureSlot(creneauRetraitId, RelaisCreneauType.Retrait);
    if (!creneau || !isCreneauBookable(creneau, this.getRelaisSettings())) {
      throw new Error('Invalid or full pickup slot');
    }

    this.update('relaisCreneaux', creneauRetraitId, { reserves: getCreneauReserves(creneau) + 1 });
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

  awardFidelite(data: { commerceId: string; clientToken: string; montant?: number }) {
    const acteur = this.getById('acteursLocaux', data.commerceId);
    if (!acteur) throw new Error('Acteur not found');

    const client = findUserByClientToken(this.getAll('users'), data.clientToken);
    if (!client) throw new Error('CLIENT_NOT_FOUND');

    const rule = getActeurFideliteRegle(acteur);
    const pointsGagnes = calculateAwardPoints(rule, data.montant);
    if (pointsGagnes <= 0) throw new Error('INVALID_POINTS');

    const now = new Date().toISOString();
    const scan = this.create('cartesFideliteScans', {
      id: `scan-${Date.now()}`,
      userId: client.id,
      commerceId: data.commerceId,
      pointsGagnes,
      date: now,
    });

    const totalPoints = client.pointsFidelite + pointsGagnes;
    this.update('users', client.id, { pointsFidelite: totalPoints });

    const newlyUnlocked =
      acteur.offreVip &&
      isVipUnlocked(totalPoints, acteur) &&
      !isVipUnlocked(client.pointsFidelite, acteur);

    return {
      scan,
      pointsGagnes,
      totalPoints,
      clientNom: client.nom,
      clientId: client.id,
      commerce: acteur.nomCommerce,
      niveau: getFideliteNiveau(totalPoints),
      vipUnlocked: newlyUnlocked ? acteur.offreVip : null,
    };
  }

  getCommerceFideliteHistory(commerceId: string) {
    const users = this.getAll('users');
    return this.getAll('cartesFideliteScans')
      .filter((scan) => scan.commerceId === commerceId)
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      .slice(0, 20)
      .map((scan) => ({
        ...scan,
        clientNom: users.find((user) => user.id === scan.userId)?.nom ?? 'Client',
      }));
  }

  getTourDeControle() {
    return computeTourDeControle({
      users: this.getAll('users'),
      posts: this.getAll('postsAnnonces'),
      relais: this.getAll('localRelais'),
      acteurs: this.getAll('acteursLocaux'),
      scans: this.getAll('cartesFideliteScans'),
      consommations: this.getAll('privilegeConsommations') ?? [],
    });
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
