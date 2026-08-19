import { useTranslation } from 'react-i18next';
import {
  formatDistanceMeters,
  haversineMeters,
} from '@idea-chartrons/shared';
import { useUserLocation } from '../context/UserLocationContext';

interface DistanceBadgeProps {
  latitude?: number | null;
  longitude?: number | null;
  className?: string;
}

export function DistanceBadge({ latitude, longitude, className = '' }: DistanceBadgeProps) {
  const { i18n, t } = useTranslation();
  const { origin, originSource } = useUserLocation();
  if (latitude == null || longitude == null || !Number.isFinite(latitude) || !Number.isFinite(longitude)) {
    return null;
  }

  const meters = haversineMeters(origin, { latitude, longitude });
  const label = formatDistanceMeters(meters, i18n.language);
  if (!label) return null;

  return (
    <p className={`text-xs font-semibold text-chartrons-green ${className}`.trim()}>
      📍 {t(originSource === 'gps' ? 'geo.fromYou' : 'geo.fromCenter', { distance: label })}
    </p>
  );
}
