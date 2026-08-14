import { Router } from 'express';
import { store } from '../data/store.js';

const router = Router();

router.get('/', (_req, res) => {
  res.json(store.getAll('acteursLocaux'));
});

router.get('/:id', (req, res) => {
  const acteur = store.getById('acteursLocaux', req.params.id);
  if (!acteur) {
    res.status(404).json({ error: 'Acteur local not found' });
    return;
  }
  res.json(acteur);
});

export default router;
