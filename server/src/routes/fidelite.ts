import {
  calculateAwardPoints,
  calculateScanPoints,
  getActeurFideliteRegle,
  getFideliteNiveau,
  isVipUnlocked,
  parseCarnetToken,
  totalCarnetPoints,
} from '@idea-chartrons/shared';
import { Router } from 'express';
import { store } from '../data/store.js';

/**
 * Carnet de fidélité en mode invité : les points appartiennent à un carnet d'appareil
 * et sont toujours recalculés depuis l'historique des passages. Aucun profil n'est stocké.
 */
const router = Router();

function scansForDevice(deviceId: string) {
  return store.getAll('cartesFideliteScans').filter((s) => s.deviceId === deviceId);
}

router.get('/', (_req, res) => {
  res.json(store.getAll('cartesFideliteScans'));
});

router.get('/carnet/:deviceId', (req, res) => {
  const acteurs = store.getAll('acteursLocaux');
  const scans = scansForDevice(req.params.deviceId)
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .map((scan) => ({
      ...scan,
      commerceNom: acteurs.find((a) => a.id === scan.commerceId)?.nomCommerce ?? 'Commerce',
    }));

  res.json(scans);
});

router.get('/carnet/:deviceId/vip', (req, res) => {
  const points = totalCarnetPoints(scansForDevice(req.params.deviceId));
  const vipStatus = store
    .getAll('acteursLocaux')
    .filter((a) => a.offreVip)
    .map((a) => ({
      commerceId: a.id,
      commerceNom: a.nomCommerce,
      offreVip: a.offreVip,
      pointsRequis: a.pointsRequisVip,
      unlocked: isVipUnlocked(points, a),
      niveau: getFideliteNiveau(points),
    }));

  res.json({ points, niveau: getFideliteNiveau(points), vipStatus });
});

router.post('/scan', (req, res) => {
  const { deviceId, commerceId, qrCode } = req.body as {
    deviceId?: string;
    commerceId?: string;
    qrCode?: string;
  };

  if (!deviceId || !commerceId || !qrCode) {
    res.status(400).json({ error: 'deviceId, commerceId and qrCode are required' });
    return;
  }

  const acteur = store.getById('acteursLocaux', commerceId);
  if (!acteur?.qrCodeVitrine || acteur.qrCodeVitrine !== qrCode) {
    res.status(400).json({ error: 'Invalid QR code for this merchant' });
    return;
  }

  const previousScans = scansForDevice(deviceId);
  const calculation = calculateScanPoints(acteur, previousScans);

  if (calculation.total === 0) {
    res.status(429).json({ error: 'Already scanned this merchant today. Try again tomorrow.' });
    return;
  }

  const pointsBefore = totalCarnetPoints(previousScans);
  const scan = store.create('cartesFideliteScans', {
    id: `scan-${Date.now()}`,
    deviceId,
    commerceId,
    pointsGagnes: calculation.total,
    date: new Date().toISOString(),
  });

  const totalPoints = pointsBefore + calculation.total;
  const newlyUnlocked =
    acteur.offreVip && isVipUnlocked(totalPoints, acteur) && !isVipUnlocked(pointsBefore, acteur);

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
  const scans = store
    .getAll('cartesFideliteScans')
    .filter((s) => s.commerceId === req.params.commerceId)
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .slice(0, 20);

  res.json(scans);
});

router.post('/award', (req, res) => {
  const { commerceId, carnetToken, montant } = req.body as {
    commerceId?: string;
    carnetToken?: string;
    montant?: number;
  };

  if (!commerceId || !carnetToken) {
    res.status(400).json({ error: 'commerceId and carnetToken are required' });
    return;
  }

  const acteur = store.getById('acteursLocaux', commerceId);
  if (!acteur) {
    res.status(404).json({ error: 'Acteur not found' });
    return;
  }

  const deviceId = parseCarnetToken(carnetToken);
  if (!deviceId) {
    res.status(400).json({ error: 'INVALID_CARNET_TOKEN' });
    return;
  }

  const pointsGagnes = calculateAwardPoints(getActeurFideliteRegle(acteur), montant);
  if (pointsGagnes <= 0) {
    res.status(400).json({ error: 'INVALID_POINTS' });
    return;
  }

  const pointsBefore = totalCarnetPoints(scansForDevice(deviceId));
  const scan = store.create('cartesFideliteScans', {
    id: `scan-${Date.now()}`,
    deviceId,
    commerceId,
    pointsGagnes,
    date: new Date().toISOString(),
  });

  const totalPoints = pointsBefore + pointsGagnes;
  const newlyUnlocked =
    acteur.offreVip && isVipUnlocked(totalPoints, acteur) && !isVipUnlocked(pointsBefore, acteur);

  res.status(201).json({
    scan,
    pointsGagnes,
    totalPoints,
    carnetId: deviceId,
    commerce: acteur.nomCommerce,
    niveau: getFideliteNiveau(totalPoints),
    vipUnlocked: newlyUnlocked ? acteur.offreVip : null,
  });
});

export default router;
