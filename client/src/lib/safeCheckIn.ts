const STORAGE_KEY = 'idea-chartrons-safe-checkin';

export interface SafeCheckInStop {
  id: string;
  title: string;
  adresse: string;
  latitude: number | null;
  longitude: number | null;
}

export function safeCheckInRouteKey(stopIds: string[]): string {
  return stopIds.join('|');
}

function readAll(): Record<string, string[]> {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw) as unknown;
    if (!parsed || typeof parsed !== 'object') return {};
    return parsed as Record<string, string[]>;
  } catch {
    return {};
  }
}

function writeAll(value: Record<string, string[]>): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(value));
  } catch {
    // private mode
  }
}

export function loadArrivedStops(routeKey: string): string[] {
  return readAll()[routeKey] ?? [];
}

export function markStopArrived(routeKey: string, stopId: string): string[] {
  const all = readAll();
  const next = Array.from(new Set([...(all[routeKey] ?? []), stopId]));
  all[routeKey] = next;
  writeAll(all);
  return next;
}

export function resetArrivedStops(routeKey: string): void {
  const all = readAll();
  delete all[routeKey];
  writeAll(all);
}
