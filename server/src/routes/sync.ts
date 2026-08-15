import { Router } from 'express';

interface VaultEntry {
  payload: unknown;
  expiresAt: number;
}

const vault = new Map<string, VaultEntry>();
const TTL_MS = 24 * 60 * 60 * 1000;
const CODE_CHARS = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';

function prune(): void {
  const now = Date.now();
  for (const [code, entry] of vault) {
    if (entry.expiresAt < now) vault.delete(code);
  }
}

function randomCode(): string {
  let code = '';
  for (let i = 0; i < 6; i += 1) {
    code += CODE_CHARS[Math.floor(Math.random() * CODE_CHARS.length)];
  }
  return code;
}

const router = Router();

router.post('/', (req, res) => {
  prune();
  const payload = req.body as unknown;
  if (!payload || typeof payload !== 'object') {
    res.status(400).json({ error: 'invalid' });
    return;
  }
  let code = randomCode();
  while (vault.has(code)) code = randomCode();
  const expiresAt = Date.now() + TTL_MS;
  vault.set(code, { payload, expiresAt });
  res.json({ code, expiresAt: new Date(expiresAt).toISOString() });
});

router.get('/:code', (req, res) => {
  prune();
  const entry = vault.get(req.params.code.toUpperCase());
  if (!entry) {
    res.status(404).json({ error: 'not_found' });
    return;
  }
  res.json(entry.payload);
});

export default router;
