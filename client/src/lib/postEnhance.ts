import {
  enhancePostDraft,
  type EnhanceDraftInput,
  type EnhanceDraftResult,
} from '@idea-chartrons/shared';

const ENHANCE_ENDPOINT = `${import.meta.env.VITE_CONCIERGE_API_URL ?? '/api/concierge'}/enhance`;

export async function enhanceDraftWithConcierge(input: EnhanceDraftInput): Promise<EnhanceDraftResult> {
  const local = enhancePostDraft(input);
  try {
    const response = await fetch(ENHANCE_ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        title: input.title,
        description: input.description,
        kind: input.kind ?? 'post',
        postType: input.postType ?? null,
        lang: input.lang ?? 'fr',
      }),
    });
    if (!response.ok) return local;
    const payload = (await response.json()) as Partial<EnhanceDraftResult>;
    const title = String(payload.title ?? '').trim();
    const description = String(payload.description ?? '').trim();
    if (!title && !description) return local;
    return {
      title: title || local.title,
      description: description || local.description,
    };
  } catch {
    return local;
  }
}
