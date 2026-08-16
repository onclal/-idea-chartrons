import {
  calculateAwardPoints,
  calculateScanPoints,
  findUserByClientToken,
  getActeurFideliteRegle,
  getFideliteNiveau,
  isVipUnlocked,
} from '@idea-chartrons/shared';
import { Router } from 'express';
import { store } from '../data/store.js';

const router = Router();

router.get('/', (_req, res) => {
  res.json(store.getAll('cartesFideliteScans'));
});

router.get('/user/:userId', (req, res) => {
  const scans = store
    .getAll('cartesFideliteScans')
    .filter((s) => s.userId === req.params.userId)
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  const acteurs = store.getAll('acteursLocaux');
  const enriched = scans.map((scan) => ({
    ...scan,
    commerceNom: acteurs.find((a) => a.id === scan.commerceId)?.nomCommerce ?? 'Commerce',
  }));

  res.json(enriched);
});

router.get('/user/:userId/vip', (req, res) => {
  const user = store.getById('users', req.params.userId);
  if (!user) {
    res.status(404).json({ error: 'User not found' });
    return;
  }

  const acteurs = store.getAll('acteursLocaux');
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

  res.json({ points: user.pointsFidelite, niveau: getFideliteNiveau(user.pointsFidelite), vipStatus });
});

router.post('/scan', (req, res) => {
  const { userId, commerceId, qrCode } = req.body as {
    userId?: string;
    commerceId?: string;
    qrCode?: string;
  };

  if (!userId || !commerceId || !qrCode) {
    res.status(400).json({ error: 'userId, commerceId and qrCode are required' });
    return;
  }

  const acteur = store.getById('acteursLocaux', commerceId);
  if (!acteur?.qrCodeVitrine || acteur.qrCodeVitrine !== qrCode) {
    res.status(400).json({ error: 'Invalid QR code for this merchant' });
    return;
  }

  const user = store.getById('users', userId);
  if (!user) {
    res.status(404).json({ error: 'User not found' });
    return;
  }

  const previousScans = store.getAll('cartesFideliteScans').filter((s) => s.userId === userId);
  const calculation = calculateScanPoints(acteur, user, previousScans);

  if (calculation.total === 0) {
    res.status(429).json({ error: 'Already scanned this merchant today. Try again tomorrow.' });
    return;
  }

  const now = new Date().toISOString();

  const scan = store.create('cartesFideliteScans', {
    id: `scan-${Date.now()}`,
    userId,
    commerceId,
    pointsGagnes: calculation.total,
    date: now,
  });

  const totalPoints = user.pointsFidelite + calculation.total;
  store.update('users', userId, { pointsFidelite: totalPoints });

  const newlyUnlocked = acteur.offreVip && isVipUnlocked(totalPoints, acteur) && !isVipUnlocked(user.pointsFidelite, acteur);

  res.status(201).json({
    scan,
    pointsGagnes: calculation.total,
    breakdown: calculation,
    totalPoints,
    commerce: acteur.nomCommerce,
    niveau: getFideliteNiveau(totalPoints),
    vipUnlocked: newlyUnlocked ? acteur.offreVip : null,
  });
});

router.get('/commerce/:commerceId', (req, res) => {
  const users = store.getAll('users');
  const scans = store
    .getAll('cartesFideliteScans')
    .filter((s) => s.commerceId === req.params.commerceId)
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .slice(0, 20)
    .map((scan) => ({
      ...scan,
      clientNom: users.find((user) => user.id === scan.userId)?.nom ?? 'Client',
    }));

  res.json(scans);
});

router.post('/award', (req, res) => {
  const { commerceId, clientToken, montant } = req.body as {
    commerceId?: string;
    clientToken?: string;
    montant?: number;
  };

  if (!commerceId || !clientToken) {
    res.status(400).json({ error: 'commerceId and clientToken are required' });
    return;
  }

  const acteur = store.getById('acteursLocaux', commerceId);
  if (!acteur) {
    res.status(404).json({ error: 'Acteur not found' });
    return;
  }

  const client = findUserByClientToken(store.getAll('users'), clientToken);
  if (!client) {
    res.status(404).json({ error: 'CLIENT_NOT_FOUND' });
    return;
  }

  const pointsGagnes = calculateAwardPoints(getActeurFideliteRegle(acteur), montant);
  if (pointsGagnes <= 0) {
    res.status(400).json({ error: 'INVALID_POINTS' });
    return;
  }

  const now = new Date().toISOString();
  const scan = store.create('cartesFideliteScans', {
    id: `scan-${Date.now()}`,
    userId: client.id,
    commerceId,
    pointsGagnes,
    date: now,
  });

  const totalPoints = client.pointsFidelite + pointsGagnes;
  store.update('users', client.id, { pointsFidelite: totalPoints });

  const newlyUnlocked =
    acteur.offreVip && isVipUnlocked(totalPoints, acteur) && !isVipUnlocked(client.pointsFidelite, acteur);

  res.status(201).json({
    scan,
    pointsGagnes,
    totalPoints,
    clientNom: client.nom,
    clientId: client.id,
    commerce: acteur.nomCommerce,
    niveau: getFideliteNiveau(totalPoints),
    vipUnlocked: newlyUnlocked ? acteur.offreVip : null,
  });
});

export default router;
