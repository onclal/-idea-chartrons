import { EventType } from '../types/enums.js';
import type { AgendaEvenement } from '../types/models.js';

/** Agenda public : fêtes de rue, associations, ateliers. */
export const COMMUNITY_EVENT_TYPES: EventType[] = [EventType.AnimationAsso, EventType.Atelier];

/** Marché des Brocanteurs : puces du dimanche et foires de rue. */
export const FLEA_MARKET_EVENT_TYPES: EventType[] = [EventType.Brocante];

export function isCommunityEvent(event: Pick<AgendaEvenement, 'type'>): boolean {
  return event.type === EventType.AnimationAsso || event.type === EventType.Atelier;
}

export function isFleaMarketEvent(event: Pick<AgendaEvenement, 'type'>): boolean {
  return event.type === EventType.Brocante;
}

export function isUpcomingEvent(event: Pick<AgendaEvenement, 'dateFin'>, now = Date.now()): boolean {
  return new Date(event.dateFin).getTime() >= now;
}
