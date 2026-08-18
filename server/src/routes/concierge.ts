import {
  buildConciergeSystemPrompt,
  buildPostEnhanceSystemPrompt,
  conciergePhrasebookLang,
  CONCIERGE_LANGUAGES,
  CONCIERGE_MAX_RESULTS,
  detectConciergeLang,
  enhancePostDraft,
  isConciergeLang,
  parseEnhancedDraft,
  runConciergeEngine,
  type ConciergeLang,
} from '@idea-chartrons/shared';
import { Router } from 'express';
import { store } from '../data/store.js';

/** Surchargeable pour un proxy ou un déploiement Azure OpenAI. */
const OPENAI_URL = process.env.OPENAI_API_URL ?? 'https://api.openai.com/v1/chat/completions';
const OPENAI_MODEL = process.env.OPENAI_MODEL ?? 'gpt-4o-mini';
const REQUEST_TIMEOUT_MS = 20_000;
const MAX_MESSAGE_LENGTH = 800;
const MAX_INSTRUCTIONS_LENGTH = 1200;
const MAX_HISTORY_TURNS = 6;
const RATE_LIMIT_WINDOW_MS = 5 * 60 * 1000;
const RATE_LIMIT_MAX_REQUESTS = 25;

type ConciergeRole = 'user' | 'assistant';

interface ConciergeTurn {
  role: ConciergeRole;
  content: string;
}

const rateLimitBuckets = new Map<string, number[]>();

function isRateLimited(key: string): boolean {
  const now = Date.now();
  const hits = (rateLimitBuckets.get(key) ?? []).filter((time) => now - time < RATE_LIMIT_WINDOW_MS);
  hits.push(now);
  rateLimitBuckets.set(key, hits);
  if (rateLimitBuckets.size > 500) {
    for (const [bucket, times] of rateLimitBuckets) {
      if (times.every((time) => now - time >= RATE_LIMIT_WINDOW_MS)) rateLimitBuckets.delete(bucket);
    }
  }
  return hits.length > RATE_LIMIT_MAX_REQUESTS;
}

function sanitizeMessage(value: unknown): string {
  return String(value ?? '')
    .replace(/[\u0000-\u0008\u000b\u000c\u000e-\u001f]/g, ' ')
    .trim()
    .slice(0, MAX_MESSAGE_LENGTH);
}

function parseHistory(value: unknown): ConciergeTurn[] {
  if (!Array.isArray(value)) return [];
  return value
    .filter((entry): entry is Record<string, unknown> => Boolean(entry) && typeof entry === 'object')
    .map((entry) => ({
      role: entry.role === 'assistant' ? ('assistant' as const) : ('user' as const),
      content: sanitizeMessage(entry.content),
    }))
    .filter((turn) => turn.content.length > 0)
    .slice(-MAX_HISTORY_TURNS);
}

/** Consignes envoyées par le panneau d'administration, ajoutées au prompt système. */
function parseInstructions(value: unknown): string {
  return String(value ?? '')
    .replace(/[\u0000-\u0008\u000b\u000c\u000e-\u001f]/g, ' ')
    .trim()
    .slice(0, MAX_INSTRUCTIONS_LENGTH);
}

function resolveLang(requested: unknown, message: string, uiLang: unknown): ConciergeLang {
  const asked = String(requested ?? 'auto');
  if (asked !== 'auto' && isConciergeLang(asked)) return asked;
  return detectConciergeLang(message, conciergePhrasebookLang(String(uiLang ?? 'fr')));
}

async function askOpenAI(
  apiKey: string,
  system: string,
  context: string,
  history: ConciergeTurn[],
  message: string,
  lang: ConciergeLang,
): Promise<string | null> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
  try {
    const response = await fetch(OPENAI_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      signal: controller.signal,
      body: JSON.stringify({
        model: OPENAI_MODEL,
        temperature: 0.4,
        max_tokens: 900,
        messages: [
          { role: 'system', content: system },
          {
            role: 'system',
            content: `Langue de réponse attendue : ${lang}.\n\n${context}`,
          },
          ...history.map((turn) => ({ role: turn.role, content: turn.content })),
          { role: 'user', content: message },
        ],
      }),
    });

    if (!response.ok) {
      console.error(`[concierge] OpenAI responded ${response.status}`);
      return null;
    }

    const payload = (await response.json()) as {
      choices?: { message?: { content?: string } }[];
    };
    const reply = payload.choices?.[0]?.message?.content?.trim();
    return reply || null;
  } catch (error) {
    console.error('[concierge] OpenAI request failed:', error instanceof Error ? error.message : error);
    return null;
  } finally {
    clearTimeout(timeout);
  }
}

const router = Router();

router.get('/status', (_req, res) => {
  res.json({
    aiEnabled: Boolean(process.env.OPENAI_API_KEY),
    model: OPENAI_MODEL,
    maxResults: CONCIERGE_MAX_RESULTS,
    languages: CONCIERGE_LANGUAGES,
  });
});

router.post('/enhance', async (req, res) => {
  const body = (req.body ?? {}) as Record<string, unknown>;
  const title = sanitizeMessage(body.title);
  const description = String(body.description ?? '')
    .replace(/[\u0000-\u0008\u000b\u000c\u000e-\u001f]/g, ' ')
    .trim()
    .slice(0, MAX_MESSAGE_LENGTH);
  const kind = body.kind === 'merchant' ? 'merchant' : 'post';
  const lang = body.lang === 'en' ? 'en' : 'fr';

  if (!title && !description) {
    res.status(400).json({ error: 'draft_required' });
    return;
  }

  const clientKey = req.ip ?? req.socket.remoteAddress ?? 'unknown';
  if (isRateLimited(`${clientKey}:enhance`)) {
    res.status(429).json({ error: 'rate_limited' });
    return;
  }

  const local = enhancePostDraft({
    title,
    description,
    kind,
    postType: typeof body.postType === 'string' ? body.postType : null,
    lang,
  });

  const apiKey = process.env.OPENAI_API_KEY;
  if (apiKey) {
    const userMessage = [
      `Type : ${kind}`,
      title ? `Titre : ${title}` : null,
      description ? `Texte : ${description}` : null,
    ]
      .filter(Boolean)
      .join('\n');
    const reply = await askOpenAI(
      apiKey,
      buildPostEnhanceSystemPrompt(lang),
      'Réécris uniquement le brouillon fourni. JSON strict.',
      [],
      userMessage,
      lang,
    );
    if (reply) {
      const parsed = parseEnhancedDraft(reply, local);
      res.json({ ...parsed, source: 'openai' });
      return;
    }
  }

  res.json({ ...local, source: 'local' });
});

router.post('/', async (req, res) => {
  const body = (req.body ?? {}) as Record<string, unknown>;
  const message = sanitizeMessage(body.message);

  if (!message) {
    res.status(400).json({ error: 'message_required' });
    return;
  }

  const clientKey = req.ip ?? req.socket.remoteAddress ?? 'unknown';
  if (isRateLimited(clientKey)) {
    res.status(429).json({ error: 'rate_limited' });
    return;
  }

  const lang = resolveLang(body.lang, message, body.uiLang);
  const history = parseHistory(body.history);
  const posts = store.getAll('postsAnnonces');
  const engine = runConciergeEngine({
    message,
    history,
    posts,
    lang,
  });
  const apiKey = process.env.OPENAI_API_KEY;

  const instructions = parseInstructions(body.instructions);
  const systemPrompt = instructions
    ? `${engine.systemPrompt || buildConciergeSystemPrompt()}\n\nCONSIGNES DE L’ÉQUIPE IDÉA CHARTRONS :\n${instructions}`
    : engine.systemPrompt;

  let reply: string | null = null;
  if (apiKey) {
    reply = await askOpenAI(apiKey, systemPrompt, engine.context, history, message, lang);
  }

  res.json({
    reply: reply ?? engine.reply,
    source: reply ? 'openai' : 'local',
    model: reply ? OPENAI_MODEL : null,
    lang,
    isLocalQuery: engine.analysis.isLocal,
    recommendations: engine.recommendations,
    heritage: engine.heritage,
    posts: engine.posts,
    basket: engine.basket,
    checklist: engine.checklist,
  });
});

export default router;
