import { Router } from 'express';
import { store } from '../data/store.js';

const router = Router();

router.get('/', (_req, res) => {
  res.json(store.getAll('agendaEvenements'));
});

router.get('/:id', (req, res) => {
  const event = store.getById('agendaEvenements', req.params.id);
  if (!event) {
    res.status(404).json({ error: 'Event not found' });
    return;
  }
  res.json(event);
});

export default router;
