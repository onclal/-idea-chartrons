import {
  CivicReportChannel,
  CivicReportStatus,
  isCivicSubcategory,
  isSafetySubcategory,
  type ReportSubcategoryId,
} from '@idea-chartrons/shared';
import { Router } from 'express';
import { store } from '../data/store.js';

/**
 * Signalements citoyens : déposés anonymement, relus dans le panneau admin
 * avant transmission au service compétent (Mairie ou Police Municipale).
 */
const router = Router();

const MAX_TEXT_LENGTH = 600;

function clean(value: unknown, max = MAX_TEXT_LENGTH): string {
  return String(value ?? '').replace(/\s+/g, ' ').trim().slice(0, max);
}

router.get('/', (_req, res) => {
  const reports = [...store.getAll('civicReports')].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
  );
  res.json(reports);
});

router.post('/', (req, res) => {
  const { subcategoryId, lieu, details, langue } = req.body as {
    subcategoryId?: string;
    lieu?: string;
    details?: string;
    langue?: string;
  };

  const id = clean(subcategoryId, 64);
  const isCivic = isCivicSubcategory(id);
  const isSafety = isSafetySubcategory(id);
  if (!isCivic && !isSafety) {
    res.status(400).json({ error: 'UNKNOWN_SUBCATEGORY' });
    return;
  }

  const cleanedLieu = clean(lieu, 160);
  if (!cleanedLieu) {
    res.status(400).json({ error: 'LIEU_REQUIRED' });
    return;
  }

  const now = new Date().toISOString();
  const report = store.create('civicReports', {
    id: `report-${Date.now()}`,
    subcategoryId: id as ReportSubcategoryId,
    channel: isCivic ? CivicReportChannel.Mairie : CivicReportChannel.Police,
    lieu: cleanedLieu,
    details: clean(details),
    statut: CivicReportStatus.Nouveau,
    langue: clean(langue, 8) || 'fr',
    createdAt: now,
    updatedAt: now,
  });

  res.status(201).json(report);
});

router.patch('/:id/statut', (req, res) => {
  const { statut } = req.body as { statut?: string };
  const allowed = Object.values(CivicReportStatus) as string[];
  if (!statut || !allowed.includes(statut)) {
    res.status(400).json({ error: 'INVALID_STATUS' });
    return;
  }

  const existing = store.getById('civicReports', req.params.id);
  if (!existing) {
    res.status(404).json({ error: 'REPORT_NOT_FOUND' });
    return;
  }

  const updated = store.update('civicReports', req.params.id, {
    statut: statut as CivicReportStatus,
    updatedAt: new Date().toISOString(),
  });

  res.json(updated);
});

export default router;
