import {
  analyzeConciergeQuery,
  buildConciergeContext,
  buildConciergeSystemPrompt,
  buildLocalConciergeReply,
  conciergePhrasebookLang,
  CONCIERGE_LANGUAGES,
  CONCIERGE_MAX_RESULTS,
  detectConciergeLang,
  heritageForQuery,
  isConciergeLang,
  rankConciergeMatches,
  type ConciergeLang,
} from '@idea-chartrons/shared';
import { Router } from 'express';

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
        max_tokens: 700,
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
  const analysis = analyzeConciergeQuery(message);
  const recommendations = rankConciergeMatches(analysis);
  const heritage = heritageForQuery(analysis);
  const apiKey = process.env.OPENAI_API_KEY;

  const instructions = parseInstructions(body.instructions);
  const systemPrompt = instructions
    ? `${buildConciergeSystemPrompt()}\n\nCONSIGNES DE L’ÉQUIPE IDÉA CHARTRONS :\n${instructions}`
    : buildConciergeSystemPrompt();

  let reply: string | null = null;
  if (apiKey) {
    reply = await askOpenAI(
      apiKey,
      systemPrompt,
      buildConciergeContext(analysis),
      parseHistory(body.history),
      message,
      lang,
    );
  }

  res.json({
    reply: reply ?? buildLocalConciergeReply(analysis, recommendations, lang),
    source: reply ? 'openai' : 'local',
    model: reply ? OPENAI_MODEL : null,
    lang,
    isLocalQuery: analysis.isLocal,
    recommendations,
    heritage,
  });
});

export default router;
