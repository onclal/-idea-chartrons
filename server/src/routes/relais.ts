import {
  LocalRelaisRetraitStatus,
  PostStatus,
  RelaisCreneauType,
  getNextStatus,
  isCreneauAvailable,
} from '@idea-chartrons/shared';
import { Router } from 'express';
import { store } from '../data/store.js';

const router = Router();

router.get('/', (_req, res) => {
  res.json(store.getAll('localRelais'));
});

router.get('/creneaux', (req, res) => {
  const type = req.query.type as RelaisCreneauType | undefined;
  let creneaux = store.getAll('relaisCreneaux');
  if (type) {
    creneaux = creneaux.filter((c) => c.type === type);
  }
  res.json(creneaux.filter(isCreneauAvailable));
});

router.get('/user/:userId', (req, res) => {
  const relais = store.getAll('localRelais').filter((r) => r.userId === req.params.userId);
  res.json(relais);
});

router.post('/', (req, res) => {
  const { postId, userId, creneauDepotId } = req.body as {
    postId?: string;
    userId?: string;
    creneauDepotId?: string;
  };

  if (!postId || !userId || !creneauDepotId) {
    res.status(400).json({ error: 'postId, userId and creneauDepotId are required' });
    return;
  }

  const post = store.getById('postsAnnonces', postId);
  if (!post) {
    res.status(404).json({ error: 'Post not found' });
    return;
  }

  const creneau = store.getById('relaisCreneaux', creneauDepotId);
  if (!creneau || creneau.type !== RelaisCreneauType.Depot || !isCreneauAvailable(creneau)) {
    res.status(400).json({ error: 'Invalid or full depot slot' });
    return;
  }

  const existing = store.getAll('localRelais').find((r) => r.postId === postId);
  if (existing) {
    res.status(409).json({ error: 'Depot already exists', relais: existing });
    return;
  }

  const now = new Date().toISOString();
  const code = `QR-CHARTRONS-${String(Date.now()).slice(-6)}`;

  store.update('relaisCreneaux', creneauDepotId, { reserves: creneau.reserves + 1 });

  const relais = store.create('localRelais', {
    id: `relais-${Date.now()}`,
    postId,
    userId,
    codeQrValidation: code,
    dateDepot: now,
    statutRetrait: LocalRelaisRetraitStatus.EnAttente,
    creneauDepotId,
    creneauRetraitId: null,
    createdAt: now,
    updatedAt: now,
  });

  store.update('postsAnnonces', postId, { statut: PostStatus.DepotLocal });

  res.status(201).json(relais);
});

router.post('/:id/reserver-retrait', (req, res) => {
  const { creneauRetraitId } = req.body as { creneauRetraitId?: string };
  const relais = store.getById('localRelais', req.params.id);

  if (!relais) {
    res.status(404).json({ error: 'Relais not found' });
    return;
  }

  if (relais.statutRetrait !== LocalRelaisRetraitStatus.DisponibleAuLocal) {
    res.status(400).json({ error: 'Item not ready for pickup' });
    return;
  }

  if (!creneauRetraitId) {
    res.status(400).json({ error: 'creneauRetraitId is required' });
    return;
  }

  const creneau = store.getById('relaisCreneaux', creneauRetraitId);
  if (!creneau || creneau.type !== RelaisCreneauType.Retrait || !isCreneauAvailable(creneau)) {
    res.status(400).json({ error: 'Invalid or full pickup slot' });
    return;
  }

  store.update('relaisCreneaux', creneauRetraitId, { reserves: creneau.reserves + 1 });

  const updated = store.update('localRelais', req.params.id, { creneauRetraitId });
  res.json(updated);
});

router.patch('/:id/avancer-statut', (_req, res) => {
  const relais = store.getById('localRelais', _req.params.id);
  if (!relais) {
    res.status(404).json({ error: 'Relais not found' });
    return;
  }

  const next = getNextStatus(relais.statutRetrait);
  if (!next) {
    res.status(400).json({ error: 'No next status available' });
    return;
  }

  const updated = store.update('localRelais', _req.params.id, { statutRetrait: next });

  if (next === LocalRelaisRetraitStatus.Recupere) {
    store.update('postsAnnonces', relais.postId, { statut: PostStatus.Cloture });
  }

  res.json(updated);
});

export default router;
