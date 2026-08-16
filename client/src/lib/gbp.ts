import {
  normalizeMenu,
  sanitizeExternalUrl,
  type ActeurLocal,
  type CommerceMenuSection,
} from '@idea-chartrons/shared';
import { localDb } from './localDb';

/**
 * Google Business Profile adapter.
 * Location keys and action-link ids stay in this module and are never returned to the UI.
 */
type GbpLocation = { locationKey: string };
type GbpActionType = 'APPOINTMENT' | 'ONLINE_APPOINTMENT';

const locations = new Map<string, GbpLocation>();
const actionLinks = new Map<string, { uri: string; type: GbpActionType }>();

function locationFor(acteurId: string): GbpLocation {
  const existing = locations.get(acteurId);
  if (existing) return existing;
  const created = { locationKey: `loc-${acteurId}` };
  locations.set(acteurId, created);
  return created;
}

function get_menus(locationKey: string): CommerceMenuSection[] {
  const acteurId = locationKey.replace(/^loc-/, '');
  const acteur = localDb.getAll('acteursLocaux').find((item) => item.id === acteurId);
  return normalizeMenu(acteur?.menu);
}

function update_menus(locationKey: string, menu: CommerceMenuSection[]): CommerceMenuSection[] {
  const acteurId = locationKey.replace(/^loc-/, '');
  const next = normalizeMenu(menu);
  localDb.updateActeur(acteurId, { menu: next });
  return next;
}

function create_place_action_link(
  locationKey: string,
  uri: string,
  type: GbpActionType,
): { uri: string } {
  const safeUri = sanitizeExternalUrl(uri);
  if (!safeUri) throw new Error('INVALID_APPOINTMENT_URL');
  actionLinks.set(locationKey, { uri: safeUri, type });
  const acteurId = locationKey.replace(/^loc-/, '');
  localDb.updateActeur(acteurId, { appointmentUrl: safeUri });
  return { uri: safeUri };
}

function update_place_action_link(
  locationKey: string,
  uri: string,
  type: GbpActionType,
): { uri: string } {
  return create_place_action_link(locationKey, uri, type);
}

function requireActeur(acteurId: string): ActeurLocal {
  const acteur = localDb.getAll('acteursLocaux').find((item) => item.id === acteurId);
  if (!acteur) throw new Error('Acteur not found');
  return acteur;
}

export function getMenus(acteurId: string): CommerceMenuSection[] {
  return get_menus(locationFor(acteurId).locationKey);
}

export function updateMenus(acteurId: string, menu: CommerceMenuSection[]): ActeurLocal {
  update_menus(locationFor(acteurId).locationKey, menu);
  return requireActeur(acteurId);
}

export function upsertAppointmentLink(acteurId: string, url: string | null): ActeurLocal {
  const safeUri = sanitizeExternalUrl(url);
  const { locationKey } = locationFor(acteurId);
  if (!safeUri) {
    actionLinks.delete(locationKey);
    return localDb.updateActeur(acteurId, { appointmentUrl: null });
  }
  const existing = actionLinks.get(locationKey);
  if (existing) {
    update_place_action_link(locationKey, safeUri, 'APPOINTMENT');
  } else {
    create_place_action_link(locationKey, safeUri, 'ONLINE_APPOINTMENT');
  }
  return requireActeur(acteurId);
}
