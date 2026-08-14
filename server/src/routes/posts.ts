import { PostStatus, PostType } from '@idea-chartrons/shared';
import { Router } from 'express';
import { store } from '../data/store.js';

const router = Router();

router.get('/', (_req, res) => {
  res.json(store.getAll('postsAnnonces'));
});

router.get('/:id', (req, res) => {
  const post = store.getById('postsAnnonces', req.params.id);
  if (!post) {
    res.status(404).json({ error: 'Post not found' });
    return;
  }
  res.json(post);
});

router.post('/', (req, res) => {
  const { titre, description, type, prix, photos, auteurId } = req.body as {
    titre?: string;
    description?: string;
    type?: PostType;
    prix?: number | null;
    photos?: string[];
    auteurId?: string;
  };

  if (!titre || !description || !type || !auteurId) {
    res.status(400).json({ error: 'Missing required fields' });
    return;
  }

  const now = new Date().toISOString();
  const post = store.create('postsAnnonces', {
    id: `post-${Date.now()}`,
    auteurId,
    titre,
    description,
    type,
    prix: prix ?? null,
    statut: PostStatus.Disponible,
    photos: photos ?? [],
    createdAt: now,
    updatedAt: now,
  });

  res.status(201).json(post);
});

router.patch('/:id/depot-local', (req, res) => {
  const post = store.getById('postsAnnonces', req.params.id);
  if (!post) {
    res.status(404).json({ error: 'Post not found' });
    return;
  }

  const updated = store.update('postsAnnonces', req.params.id, {
    statut: PostStatus.DepotLocal,
  });

  res.json(updated);
});

export default router;
