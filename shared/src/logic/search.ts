/**
 * Moteur de recherche d’activités : insensible aux accents, tolérant au
 * singulier/pluriel, et enrichi d’un dictionnaire d’alias (DAB, crèche…).
 */

export interface ActivityAliasGroup {
  canonical: string;
  aliases: string[];
}

export const ACTIVITY_ALIAS_GROUPS: ActivityAliasGroup[] = [
  {
    canonical: 'distributeur automatique de billets',
    aliases: [
      'dab',
      'atm',
      'cash',
      'bank',
      'banque',
      'cash machine',
      'distributeur',
      'distributeurs',
      'billets',
      'retrait',
      'argent',
      'cajero',
      'geldautomat',
      'bancomat',
    ],
  },
  {
    canonical: 'creche',
    aliases: ['creche', 'creches', 'nursery', 'kindergarten', 'halte garderie', 'nounou', 'petite enfance', 'kita', 'asilo'],
  },
  {
    canonical: 'pharmacie',
    aliases: ['pharmacie', 'pharmacies', 'pharmacy', 'drugstore', 'farmacia', 'apotheke', 'medicament'],
  },
  {
    canonical: 'boulangerie',
    aliases: ['boulangerie', 'boulangeries', 'bakery', 'bakeries', 'pain', 'baguette', 'viennoiserie'],
  },
  {
    canonical: 'restaurant',
    aliases: ['restaurant', 'restaurants', 'resto', 'bistro', 'brasserie', 'table', 'manger'],
  },
  {
    canonical: 'coiffeur',
    aliases: ['coiffeur', 'coiffeurs', 'coiffure', 'barbier', 'barbershop', 'hairdresser', 'haircut'],
  },
  {
    canonical: 'ecole',
    aliases: ['ecole', 'ecoles', 'school', 'schools', 'college', 'lycee', 'scolaire'],
  },
  {
    canonical: 'caviste',
    aliases: ['caviste', 'cavistes', 'vin', 'vins', 'wine', 'cave', 'bouteille'],
  },
];

const ALIAS_LOOKUP: Map<string, ActivityAliasGroup> = (() => {
  const map = new Map<string, ActivityAliasGroup>();
  for (const group of ACTIVITY_ALIAS_GROUPS) {
    for (const term of [group.canonical, ...group.aliases]) {
      map.set(normalizeSearchText(term), group);
    }
  }
  return map;
})();

/** Supprime accents et ponctuation : `crèche` → `creche`. */
export function stripSearchAccents(value: string): string {
  return value.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
}

export function normalizeSearchText(value: string): string {
  return stripSearchAccents(value)
    .toLowerCase()
    .replace(/[’']/g, ' ')
    .replace(/[^a-z0-9]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

/** Racinisation légère FR/EN : restaurants → restaurant, crèches → creche. */
export function stemSearchToken(value: string): string {
  const word = normalizeSearchText(value);
  if (word.length <= 3) return word;
  if (word.endsWith('ies') && word.length > 4) return `${word.slice(0, -3)}y`;
  if (word.endsWith('eaux') && word.length > 5) return word.slice(0, -1);
  if (word.endsWith('aux') && word.length > 4) return word.slice(0, -3);
  if (word.endsWith('ses') && word.length > 4) return word.slice(0, -1);
  if ((word.endsWith('s') || word.endsWith('x')) && word.length > 3) return word.slice(0, -1);
  if (word.endsWith('es') && word.length > 4) return word.slice(0, -2);
  return word;
}

export function tokensMatch(a: string, b: string): boolean {
  const left = stemSearchToken(a);
  const right = stemSearchToken(b);
  if (!left || !right) return false;
  if (left === right) return true;
  if (left.length >= 4 && right.length >= 4 && (left.startsWith(right) || right.startsWith(left))) {
    return true;
  }
  return false;
}

function lookupAliasGroup(token: string): ActivityAliasGroup | undefined {
  const normalized = normalizeSearchText(token);
  const exact = ALIAS_LOOKUP.get(normalized);
  if (exact) return exact;
  const stemmed = stemSearchToken(normalized);
  if (stemmed !== normalized) return ALIAS_LOOKUP.get(stemmed);
  return undefined;
}

/** Étend une requête avec tiges et alias (`cash` → DAB, `creches` → crèche). */
export function expandActivityQuery(query: string): string[] {
  const normalized = normalizeSearchText(query);
  if (!normalized) return [];

  const tokens = new Set<string>([normalized]);
  for (const token of normalized.split(' ').filter(Boolean)) {
    tokens.add(token);
    tokens.add(stemSearchToken(token));
    const group = lookupAliasGroup(token) ?? lookupAliasGroup(normalized);
    if (!group) continue;
    tokens.add(normalizeSearchText(group.canonical));
    for (const alias of group.aliases) {
      tokens.add(normalizeSearchText(alias));
    }
  }

  const whole = lookupAliasGroup(normalized);
  if (whole) {
    tokens.add(normalizeSearchText(whole.canonical));
    for (const alias of whole.aliases) tokens.add(normalizeSearchText(alias));
  }

  return [...tokens].filter(Boolean);
}

function fuzzyIncludes(haystack: string, needle: string): boolean {
  if (!needle) return false;
  if (haystack.includes(needle)) return true;
  const needleStem = stemSearchToken(needle);
  if (needleStem.length >= 3 && haystack.includes(needleStem)) return true;
  const hayTokens = haystack.split(' ').filter(Boolean);
  return hayTokens.some((token) => tokensMatch(token, needle));
}

/** Correspondance tolérante d’un texte libre à une requête d’activité. */
export function matchesSearchQuery(text: string, query: string): boolean {
  if (!query.trim()) return true;
  const haystack = normalizeSearchText(text);
  if (!haystack) return false;
  return expandActivityQuery(query).some((token) => token.length >= 2 && fuzzyIncludes(haystack, token));
}

export function matchesAnySearchQuery(fields: Array<string | null | undefined>, query: string): boolean {
  if (!query.trim()) return true;
  return matchesSearchQuery(fields.filter(Boolean).join(' '), query);
}
