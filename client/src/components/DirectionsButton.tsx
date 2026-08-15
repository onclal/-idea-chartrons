import { useTranslation } from 'react-i18next';
import { Button } from './ui';
import { walkingDirectionsUrl, walkingItineraryUrl, type GeoPoint } from '../lib/itinerary';

interface DirectionsButtonProps {
  latitude?: number;
  longitude?: number;
  stops?: GeoPoint[];
  label?: string;
  className?: string;
}

export function DirectionsButton({
  latitude,
  longitude,
  stops,
  label,
  className = '',
}: DirectionsButtonProps) {
  const { t } = useTranslation();
  const href =
    stops && stops.length > 0
      ? walkingItineraryUrl(stops)
      : latitude != null && longitude != null
        ? walkingDirectionsUrl({ latitude, longitude })
        : null;

  if (!href) return null;

  return (
    <Button
      type="button"
      size="sm"
      variant="bordeaux"
      className={`flex-1 ${className}`}
      onClick={() => window.open(href, '_blank', 'noopener,noreferrer')}
    >
      {label ?? t('map.goThere')}
    </Button>
  );
}
