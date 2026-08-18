import { allChartronsPois } from '../data/chartronsPois.js';
import { CHARTRONS_MAP_CENTER } from '../data/mapPois.js';
import type { ChartronsPoi, PoiCatalogItem } from '../types/poi.js';
import { normalizeHeritageText } from '../data/chartronsHeritage.js';
import { normalizeSearchText } from './search.js';

export interface RecipeIngredient {
  id: string;
  name: { fr: string; en: string };
  aliases: string[];
  quantity: { fr: string; en: string };
  estimatedPrice: number;
}

export interface ChartronsRecipe {
  id: string;
  names: string[];
  title: { fr: string; en: string };
  summary: { fr: string; en: string };
  steps: { fr: string; en: string };
  ingredients: RecipeIngredient[];
}

export interface BasketLine {
  ingredientId: string;
  name: string;
  quantity: string;
  price: number;
  poiId: string;
  shopName: string;
}

export interface BasketStop {
  poiId: string;
  name: string;
  address: string;
  coordinates: { lat: number; lng: number };
  phone: string | null;
  premium: boolean;
  lines: BasketLine[];
  subtotal: number;
}

export interface LocalBasket {
  recipeId: string;
  title: string;
  summary: string;
  steps: string;
  unmatched: string[];
  stops: BasketStop[];
  totalEstimate: number;
}

const RECIPES: ChartronsRecipe[] = [
  {
    id: 'caneles',
    names: ['canele', 'caneles', 'canelé', 'canelés', 'canneles', 'cannelé', 'bordeaux cake'],
    title: { fr: 'Canelés bordelais', en: 'Bordeaux canelés' },
    summary: {
      fr: 'Le gâteau signature du quartier : croûte caramélisée, cœur fondant à la vanille et au rhum.',
      en: 'The neighborhood’s signature cake: a caramelized crust and a vanilla-rum custard heart.',
    },
    steps: {
      fr: 'Faites infuser le lait à la vanille. Mélangez beurre, sucre, farine et jaunes, puis le rhum. Reposez 24 h au frais, beurrez les moules et cuisez 1 h à 180 °C.',
      en: 'Infuse the milk with vanilla. Mix butter, sugar, flour and yolks, then the rum. Rest 24 h in the fridge, butter the molds and bake 1 h at 180 °C.',
    },
    ingredients: [
      ing('lait', 'Lait entier', 'Whole milk', ['lait', 'milk'], '50 cl', 1.4),
      ing('vanille', 'Gousse de vanille', 'Vanilla pod', ['vanille', 'vanilla'], '1 gousse', 4.2),
      ing('beurre', 'Beurre doux', 'Unsalted butter', ['beurre', 'butter'], '50 g', 1.8),
      ing('farine', 'Farine T55', 'Plain flour', ['farine', 'flour'], '100 g', 0.8),
      ing('sucre', 'Sucre semoule', 'Caster sugar', ['sucre', 'sugar'], '250 g', 1.6),
      ing('oeufs', 'Jaunes d’œufs', 'Egg yolks', ['oeuf', 'oeufs', 'egg', 'eggs', 'jaune'], '2 jaunes', 1.4),
      ing('rhum', 'Rhum agricole', 'Agricultural rum', ['rhum', 'rum'], '4 cl', 3.5),
    ],
  },
  {
    id: 'entrecote',
    names: ['entrecote', 'entrecôte', 'steak', 'viande', 'marchand de vin'],
    title: { fr: 'Entrecôte marchand de vin', en: 'Entrecôte in wine sauce' },
    summary: {
      fr: 'Un classique des bistrots chartronnais, à servir avec une bouteille du quartier.',
      en: 'A Chartrons bistro classic, served with a neighborhood bottle.',
    },
    steps: {
      fr: 'Saisissez l’entrecôte, déglacez au vin rouge, montez au beurre. Servez avec une salade du marché.',
      en: 'Sear the steak, deglaze with red wine, finish with butter. Serve with market salad.',
    },
    ingredients: [
      ing('entrecote', 'Entrecôte', 'Rib-eye steak', ['entrecote', 'steak', 'viande', 'beef'], '2 pièces', 18),
      ing('vin', 'Vin rouge de Bordeaux', 'Bordeaux red wine', ['vin', 'wine', 'bordeaux'], '20 cl', 6),
      ing('beurre', 'Beurre', 'Butter', ['beurre', 'butter'], '30 g', 1.2),
      ing('salade', 'Salade du marché', 'Market salad', ['salade', 'salad', 'laitue'], '1 pièce', 1.8),
    ],
  },
  {
    id: 'salade',
    names: ['salade', 'salad', 'tomate', 'tomato', 'marche'],
    title: { fr: 'Salade du marché des Chartrons', en: 'Chartrons market salad' },
    summary: {
      fr: 'Une salade de saison achetée au fil des commerces du quartier.',
      en: 'A seasonal salad shopped from neighborhood stores.',
    },
    steps: {
      fr: 'Lavez la salade et les tomates. Assaisonnez, ajoutez le fromage et un filet d’huile.',
      en: 'Wash the salad and tomatoes. Dress, add cheese and a drizzle of oil.',
    },
    ingredients: [
      ing('salade', 'Salade', 'Salad leaves', ['salade', 'salad'], '1 pièce', 1.8),
      ing('tomates', 'Tomates', 'Tomatoes', ['tomate', 'tomato'], '500 g', 3.2),
      ing('fromage', 'Fromage de chèvre', 'Goat cheese', ['fromage', 'cheese', 'chevre'], '1 palet', 4.5),
      ing('pain', 'Pain de campagne', 'Country bread', ['pain', 'bread', 'baguette'], '1 pièce', 1.4),
    ],
  },
];

function ing(
  id: string,
  fr: string,
  en: string,
  aliases: string[],
  quantity: string,
  estimatedPrice: number,
): RecipeIngredient {
  return {
    id,
    name: { fr, en },
    aliases,
    quantity: { fr: quantity, en: quantity },
    estimatedPrice,
  };
}

const SPECIALTY_CATALOG: { hints: string[]; items: PoiCatalogItem[] }[] = [
  {
    hints: ['boulangerie', 'bakery', 'pain'],
    items: [
      { name: 'Baguette', price: 1.2, ingredients: ['pain', 'baguette'] },
      { name: 'Farine T55 1 kg', price: 2.4, ingredients: ['farine', 'flour'] },
      { name: 'Beurre doux 250 g', price: 3.2, ingredients: ['beurre', 'butter'] },
    ],
  },
  {
    hints: ['patisserie', 'pastry', 'canele'],
    items: [
      { name: 'Canelés', price: 2.5, ingredients: ['canele'] },
      { name: 'Sucre vanillé', price: 1.8, ingredients: ['sucre', 'vanille', 'sugar', 'vanilla'] },
    ],
  },
  {
    hints: ['caviste', 'vin', 'wine'],
    items: [
      { name: 'Bordeaux rouge', price: 12, ingredients: ['vin', 'wine'] },
      { name: 'Rhum agricole 20 cl', price: 8.5, ingredients: ['rhum', 'rum'] },
    ],
  },
  {
    hints: ['boucherie', 'charcuterie', 'butcher', 'viande'],
    items: [
      { name: 'Entrecôte', price: 18, ingredients: ['entrecote', 'steak', 'viande', 'beef'] },
      { name: 'Œufs fermiers x6', price: 3.5, ingredients: ['oeuf', 'oeufs', 'egg'] },
    ],
  },
  {
    hints: ['fromagerie', 'dairy', 'cremerie', 'fromage'],
    items: [
      { name: 'Beurre de baratte', price: 4.5, ingredients: ['beurre', 'butter'] },
      { name: 'Fromage de chèvre', price: 4.8, ingredients: ['fromage', 'cheese'] },
      { name: 'Lait entier 1 L', price: 1.4, ingredients: ['lait', 'milk'] },
    ],
  },
  {
    hints: ['epicerie', 'supermarche', 'alimentation', 'grocery', 'convenience', 'primeur'],
    items: [
      { name: 'Lait 1 L', price: 1.3, ingredients: ['lait', 'milk'] },
      { name: 'Sucre 1 kg', price: 1.6, ingredients: ['sucre', 'sugar'] },
      { name: 'Vanille', price: 4.2, ingredients: ['vanille', 'vanilla'] },
      { name: 'Œufs x6', price: 2.8, ingredients: ['oeuf', 'oeufs', 'egg'] },
      { name: 'Farine 1 kg', price: 1.9, ingredients: ['farine', 'flour'] },
      { name: 'Salade', price: 1.8, ingredients: ['salade', 'salad'] },
      { name: 'Tomates', price: 3.2, ingredients: ['tomate', 'tomato'] },
    ],
  },
];

export function isRecipeQueryText(query: string): boolean {
  const hay = normalizeHeritageText(query);
  if (['recette', 'recipe', 'ingredient', 'ingredients', 'preparer', 'cook', 'cooking'].some((hint) => hay.includes(hint))) {
    return true;
  }
  return RECIPES.some((recipe) => recipe.names.some((name) => hay.includes(normalizeHeritageText(name))));
}

export function matchChartronsRecipe(query: string): ChartronsRecipe | null {
  const hay = normalizeHeritageText(query);
  const named = RECIPES.find((recipe) => recipe.names.some((name) => hay.includes(normalizeHeritageText(name))));
  if (named) return named;
  if (['recette', 'recipe', 'canele', 'gateau', 'cake'].some((hint) => hay.includes(hint))) return RECIPES[0];
  return null;
}

export function catalogItemsForPoi(poi: ChartronsPoi): PoiCatalogItem[] {
  if (poi.catalog?.items?.length) return poi.catalog.items;
  const specialty = normalizeSearchText(poi.specialty);
  const match = SPECIALTY_CATALOG.find((entry) => entry.hints.some((hint) => specialty.includes(hint)));
  return match?.items ?? [];
}

function itemMatchesIngredient(item: PoiCatalogItem, ingredient: RecipeIngredient): boolean {
  const hay = normalizeSearchText(`${item.name} ${(item.ingredients ?? []).join(' ')}`);
  return ingredient.aliases.some((alias) => hay.includes(normalizeSearchText(alias)));
}

function poiMatchesIngredient(poi: ChartronsPoi, ingredient: RecipeIngredient): boolean {
  const items = catalogItemsForPoi(poi);
  if (items.some((item) => itemMatchesIngredient(item, ingredient))) return true;
  const hay = normalizeSearchText(`${poi.specialty} ${poi.name}`);
  return ingredient.aliases.some((alias) => hay.includes(normalizeSearchText(alias)));
}

function priceForIngredient(poi: ChartronsPoi, ingredient: RecipeIngredient): number {
  const priced = catalogItemsForPoi(poi).find(
    (item) => itemMatchesIngredient(item, ingredient) && typeof item.price === 'number',
  );
  return priced?.price ?? ingredient.estimatedPrice;
}

function distanceToCenter(poi: ChartronsPoi): number {
  const dLat = poi.coordinates.lat - CHARTRONS_MAP_CENTER.latitude;
  const dLng = poi.coordinates.lng - CHARTRONS_MAP_CENTER.longitude;
  return dLat * dLat + dLng * dLng;
}

function pickShop(ingredient: RecipeIngredient, pool: ChartronsPoi[]): ChartronsPoi | null {
  const candidates = pool.filter((poi) => poi.isMerchant && poiMatchesIngredient(poi, ingredient));
  if (candidates.length === 0) return null;
  return [...candidates].sort((a, b) => {
    const premium = Number(b.tier === 'premium_pro') - Number(a.tier === 'premium_pro');
    if (premium !== 0) return premium;
    const catalog = catalogItemsForPoi(b).length - catalogItemsForPoi(a).length;
    if (catalog !== 0) return catalog;
    return distanceToCenter(a) - distanceToCenter(b);
  })[0];
}

function orderStops(stops: BasketStop[]): BasketStop[] {
  if (stops.length <= 1) return stops;
  const remaining = [...stops];
  const ordered: BasketStop[] = [];
  let current: { lat: number; lng: number } = {
    lat: CHARTRONS_MAP_CENTER.latitude,
    lng: CHARTRONS_MAP_CENTER.longitude,
  };
  while (remaining.length > 0) {
    remaining.sort((a, b) => {
      const da = (a.coordinates.lat - current.lat) ** 2 + (a.coordinates.lng - current.lng) ** 2;
      const db = (b.coordinates.lat - current.lat) ** 2 + (b.coordinates.lng - current.lng) ** 2;
      return da - db;
    });
    const next = remaining.shift()!;
    ordered.push(next);
    current = next.coordinates;
  }
  return ordered;
}

export function buildLocalBasket(query: string, lang: 'fr' | 'en' = 'fr'): LocalBasket | null {
  const recipe = matchChartronsRecipe(query);
  if (!recipe) return null;
  const pool = allChartronsPois();
  const unmatched: string[] = [];
  const byShop = new Map<string, BasketStop>();

  for (const ingredient of recipe.ingredients) {
    const shop = pickShop(ingredient, pool);
    const label = lang === 'en' ? ingredient.name.en : ingredient.name.fr;
    const quantity = lang === 'en' ? ingredient.quantity.en : ingredient.quantity.fr;
    if (!shop) {
      unmatched.push(`${label} (${quantity})`);
      continue;
    }
    const line: BasketLine = {
      ingredientId: ingredient.id,
      name: label,
      quantity,
      price: priceForIngredient(shop, ingredient),
      poiId: shop.id,
      shopName: shop.name,
    };
    const existing = byShop.get(shop.id);
    if (existing) {
      existing.lines.push(line);
      existing.subtotal += line.price;
    } else {
      byShop.set(shop.id, {
        poiId: shop.id,
        name: shop.name,
        address: shop.address,
        coordinates: shop.coordinates,
        phone: shop.phone ?? null,
        premium: shop.tier === 'premium_pro',
        lines: [line],
        subtotal: line.price,
      });
    }
  }

  const stops = orderStops([...byShop.values()]);
  const totalEstimate = Math.round((stops.reduce((sum, stop) => sum + stop.subtotal, 0) + Number.EPSILON) * 10) / 10;

  return {
    recipeId: recipe.id,
    title: lang === 'en' ? recipe.title.en : recipe.title.fr,
    summary: lang === 'en' ? recipe.summary.en : recipe.summary.fr,
    steps: lang === 'en' ? recipe.steps.en : recipe.steps.fr,
    unmatched,
    stops,
    totalEstimate,
  };
}

export function basketChecklist(basket: LocalBasket): string[] {
  return basket.stops.flatMap((stop) =>
    stop.lines.map((line) => `${line.name} (${line.quantity}) — ${stop.name} · ${line.price.toFixed(2)} €`),
  );
}
