import { itineraryDistanceKm } from './itinerary';
import { loadReceipts } from './receipts';
import { loadSavedRoutes } from './routes';

/** Émissions évitées en marchant plutôt qu’en voiture thermique (kg CO₂ / km). */
export const CO2_KG_PER_WALKED_KM = 0.12;

export interface LocalImpactStats {
  walkingKm: number;
  co2Kg: number;
  averageSpend: number;
  receiptCount: number;
}

export function walkingKmFromSavedRoutes(): number {
  return loadSavedRoutes().reduce((sum, route) => {
    const points = route.stops.map((stop) => ({
      latitude: stop.latitude,
      longitude: stop.longitude,
    }));
    return sum + itineraryDistanceKm(points);
  }, 0);
}

export function computeLocalImpact(): LocalImpactStats {
  const receipts = loadReceipts();
  const walkingFromOrdersKm =
    receipts.reduce((sum, receipt) => sum + (receipt.walkingMeters ?? 0), 0) / 1000;
  const walkingKm = walkingFromOrdersKm + walkingKmFromSavedRoutes();
  const paidTotals = receipts.filter((receipt) => receipt.paymentStatus === 'paid').map((receipt) => receipt.total);
  const averageSpend =
    paidTotals.length > 0 ? paidTotals.reduce((sum, value) => sum + value, 0) / paidTotals.length : 0;

  return {
    walkingKm,
    co2Kg: walkingKm * CO2_KG_PER_WALKED_KM,
    averageSpend,
    receiptCount: receipts.length,
  };
}
