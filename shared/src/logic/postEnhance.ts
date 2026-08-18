import { PostType } from '../types/enums.js';

export type EnhanceDraftKind = 'post' | 'merchant';
export type EnhanceDraftLang = 'fr' | 'en';

export interface EnhanceDraftInput {
  title: string;
  description: string;
  kind?: EnhanceDraftKind;
  postType?: PostType | string | null;
  lang?: EnhanceDraftLang;
}

export interface EnhanceDraftResult {
  title: string;
  description: string;
}

function collapseWhitespace(value: string): string {
  return String(value ?? '')
    .replace(/\s+/g, ' ')
    .trim();
}

function polishTitle(value: string): string {
  const text = collapseWhitespace(value);
  if (!text) return '';
  const withoutTrail = text.replace(/[.]+$/u, '');
  return withoutTrail.charAt(0).toLocaleUpperCase('fr-FR') + withoutTrail.slice(1);
}

function polishParagraph(value: string): string {
  const text = collapseWhitespace(value)
    .replace(/!{2,}/g, ' !')
    .replace(/\?{2,}/g, ' ?');
  if (!text) return '';
  const capitalized = text.charAt(0).toLocaleUpperCase('fr-FR') + text.slice(1);
  return /[.!?…]$/u.test(capitalized) ? capitalized : `${capitalized}.`;
}

function neighborhoodFrame(kind: EnhanceDraftKind, lang: EnhanceDraftLang, body: string): string {
  if (/chartrons/i.test(body)) return body;
  if (lang === 'en') {
    return kind === 'merchant'
      ? `In the Chartrons neighborhood: ${body}`
      : `From a Chartrons neighbor: ${body}`;
  }
  return kind === 'merchant'
    ? `Dans le quartier des Chartrons : ${body}`
    : `Annonce du quartier des Chartrons : ${body}`;
}

function politeClose(kind: EnhanceDraftKind, lang: EnhanceDraftLang, body: string): string {
  if (lang === 'en') {
    const already =
      /welcome|feel free|do not hesitate|looking forward|kind regards/i.test(body);
    if (already) return body;
    return kind === 'merchant'
      ? `${body} Feel free to get in touch — we will be glad to welcome you.`
      : `${body} Feel free to write if you would like more details.`;
  }
  const already = /n'hésitez|n’hésitez|au plaisir|bienvenue|cordialement/i.test(body);
  if (already) return body;
  return kind === 'merchant'
    ? `${body} N’hésitez pas à nous écrire : nous vous accueillons avec plaisir.`
    : `${body} N’hésitez pas à écrire pour plus de précisions.`;
}

export function buildPostEnhanceSystemPrompt(lang: EnhanceDraftLang = 'fr'): string {
  const language = lang === 'en' ? 'English' : 'français';
  return [
    'Tu es le Concierge IDÉA CHARTRONS.',
    'Réécris ce brouillon pour le quartier des Chartrons (Bordeaux) : clair, poli, attractif.',
    'Ne jamais inventer de faits (prix, horaires, adresse, quantités, engagements).',
    'Conserver toutes les informations présentes. Ne pas ajouter de coordonnées.',
    `Réponds exclusivement en ${language}, sous la forme JSON : {"title":"...","description":"..."}.`,
  ].join(' ');
}

export function parseEnhancedDraft(raw: string, fallback: EnhanceDraftResult): EnhanceDraftResult {
  const text = String(raw ?? '').trim();
  const match = text.match(/\{[\s\S]*\}/);
  if (!match) return fallback;
  try {
    const parsed = JSON.parse(match[0]) as { title?: unknown; description?: unknown };
    const title = collapseWhitespace(String(parsed.title ?? ''));
    const description = collapseWhitespace(String(parsed.description ?? ''));
    if (!title && !description) return fallback;
    return {
      title: title || fallback.title,
      description: description || fallback.description,
    };
  } catch {
    return fallback;
  }
}

/** Réécriture locale du brouillon : lisible, polie, sans invention de faits. */
export function enhancePostDraft(input: EnhanceDraftInput): EnhanceDraftResult {
  const kind: EnhanceDraftKind = input.kind ?? 'post';
  const lang: EnhanceDraftLang = input.lang === 'en' ? 'en' : 'fr';
  const title = polishTitle(input.title);
  const body = polishParagraph(input.description);
  if (!title && !body) {
    return { title: '', description: '' };
  }
  const framed = body ? neighborhoodFrame(kind, lang, body) : '';
  return {
    title,
    description: framed ? politeClose(kind, lang, framed) : '',
  };
}
