import type {
  AntiqueItem,
  BudgetEstimate,
  BudgetUnit,
  ConciergeLang,
  ConciergeRecommendation,
  LocalBasket,
  PostAnnonce,
  StreetHeritage,
} from '@idea-chartrons/shared';
import { walkingItineraryUrl } from './itinerary';
import { buildSmsHref, buildWhatsAppHref } from './phone';
import {
  askConcierge as requestConcierge,
  localConciergeAnswer as localEngineAnswer,
  type AskConciergeInput,
  type ConciergeAnswer,
  type ConciergeLangChoice,
  type ConciergeSource,
} from '../services/concierge';

export type { AskConciergeInput, ConciergeAnswer, ConciergeLangChoice, ConciergeSource };

export interface ConciergeOrderLine {
  name: string;
  quantity?: string;
  price: number;
}

export interface ConciergeOrderShop {
  poiId: string;
  name: string;
  address: string;
  coordinates: { lat: number; lng: number };
  hasDelivery?: boolean;
  distanceMeters?: number;
}

export interface ConciergeMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  createdAt: string;
  source?: ConciergeSource;
  lang?: ConciergeLang;
  recommendations?: ConciergeRecommendation[];
  heritage?: StreetHeritage[];
  posts?: PostAnnonce[];
  antiqueItems?: AntiqueItem[];
  basket?: LocalBasket | null;
  checklist?: string[];
}

export function localConciergeAnswer(input: AskConciergeInput): ConciergeAnswer {
  return localEngineAnswer(input);
}

export async function askConcierge(input: AskConciergeInput): Promise<ConciergeAnswer> {
  return requestConcierge(input);
}

export function formatConciergeBudget(
  budget: BudgetEstimate | null,
  unitLabel: (unit: BudgetUnit) => string,
): string | null {
  if (!budget) return null;
  return `${budget.min}–${budget.max} € ${unitLabel(budget.unit)}`;
}

/** Message de commande pré-rempli, envoyé au commerçant via WhatsApp ou SMS. */
export function buildConciergeOrderText(
  recommendation: ConciergeRecommendation,
  lang: ConciergeLang,
): string {
  const isFrench = lang === 'fr';
  const lines = isFrench
    ? [
        `Bonjour ${recommendation.name},`,
        '',
        'Je vous contacte via IDÉA CHARTRONS (concierge du quartier des Chartrons).',
        'Je souhaiterais passer une commande en Click & Collect :',
        '- Produit / prestation : ',
        '- Quantité : ',
        '- Heure de retrait souhaitée : ',
        '',
        'Merci de me confirmer la disponibilité. Bonne journée !',
      ]
    : [
        `Hello ${recommendation.name},`,
        '',
        'I am contacting you through IDÉA CHARTRONS (the Chartrons district concierge).',
        'I would like to place a Click & Collect order:',
        '- Product / service: ',
        '- Quantity: ',
        '- Preferred pickup time: ',
        '',
        'Could you confirm availability? Thank you!',
      ];
  return lines.join('\n');
}

export function conciergeWhatsAppHref(
  recommendation: ConciergeRecommendation,
  lang: ConciergeLang,
): string | null {
  if (!recommendation.phone) return null;
  return buildWhatsAppHref(recommendation.phone, buildConciergeOrderText(recommendation, lang));
}

export function conciergeSmsHref(
  recommendation: ConciergeRecommendation,
  lang: ConciergeLang,
): string | null {
  if (!recommendation.phone) return null;
  return buildSmsHref(recommendation.phone, buildConciergeOrderText(recommendation, lang));
}

/** Itinéraire piéton Google Maps enchaînant les adresses recommandées. */
export function conciergeWalkingRouteUrl(recommendations: ConciergeRecommendation[]): string | null {
  const stops = recommendations.map((item) => ({
    latitude: item.coordinates.lat,
    longitude: item.coordinates.lng,
  }));
  return walkingItineraryUrl(stops);
}

export function canPlaceConciergeOrder(item: ConciergeRecommendation): boolean {
  return item.action === 'click_collect' || item.clickAndCollect || item.hasDelivery;
}

export function orderShopFromRecommendation(item: ConciergeRecommendation): ConciergeOrderShop {
  return {
    poiId: item.poiId,
    name: item.name,
    address: item.address,
    coordinates: item.coordinates,
    hasDelivery: item.hasDelivery,
    distanceMeters: item.distanceMeters,
  };
}

export function orderLinesFromRecommendation(item: ConciergeRecommendation): ConciergeOrderLine[] {
  return [
    {
      name: item.specialty || item.name,
      quantity: '1',
      price: item.budget?.min ?? 12,
    },
  ];
}

export function orderShopFromBasket(basket: LocalBasket): ConciergeOrderShop | null {
  const stop = basket.stops[0];
  if (!stop) return null;
  return {
    poiId: stop.poiId,
    name: basket.stops.length > 1 ? basket.title : stop.name,
    address: stop.address,
    coordinates: stop.coordinates,
    hasDelivery: true,
  };
}

export function orderLinesFromBasket(basket: LocalBasket): ConciergeOrderLine[] {
  return basket.stops.flatMap((stop) =>
    stop.lines.map((line) => ({
      name: basket.stops.length > 1 ? `${line.name} · ${stop.name}` : line.name,
      quantity: line.quantity,
      price: line.price,
    })),
  );
}

export const CONCIERGE_LANG_OPTIONS: { value: ConciergeLangChoice; label: string }[] = [
  { value: 'auto', label: 'Auto' },
  { value: 'fr', label: 'Français' },
  { value: 'en', label: 'English' },
  { value: 'es', label: 'Español' },
  { value: 'de', label: 'Deutsch' },
  { value: 'it', label: 'Italiano' },
  { value: 'pt', label: 'Português' },
  { value: 'nl', label: 'Nederlands' },
];
