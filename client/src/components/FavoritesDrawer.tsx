import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { hasCoordinates } from '@idea-chartrons/shared';
import { Badge, Button, EmptyState, Modal } from './ui';
import { DirectionsButton } from './DirectionsButton';
import { ShareButton } from './ShareButton';
import { useFavorites } from '../context/FavoritesContext';
import { appUrl, placeShareText } from '../lib/share';

interface FavoritesDrawerProps {
  open: boolean;
  onClose: () => void;
}

export function FavoritesDrawer({ open, onClose }: FavoritesDrawerProps) {
  const { t } = useTranslation();
  const { favorites, removeFavorite } = useFavorites();

  return (
    <Modal open={open} onClose={onClose} title={t('favorites.title')}>
      {favorites.length === 0 ? (
        <EmptyState icon="♡" title={t('favorites.emptyTitle')} message={t('favorites.emptyHint')} />
      ) : (
        <>
          {favorites.filter(hasCoordinates).length >= 2 && (
            <Link to="/carte?parcours=1" onClick={onClose} className="mb-3 block">
              <Button type="button" size="sm" variant="bordeaux" className="w-full">
                {t('favorites.seeRoute')}
              </Button>
            </Link>
          )}
          <ul className="space-y-3">
          {favorites.map((place) => (
            <li key={place.id} className="rounded-2xl border border-chartrons-beige bg-white p-3">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <p className="font-semibold text-chartrons-olive-dark">{place.title}</p>
                  <div className="mt-1">
                    <Badge variant="olive">{place.subtitle}</Badge>
                  </div>
                  <p className="text-xs text-chartrons-warm-gray mt-1.5">📍 {place.adresse}</p>
                </div>
                <button
                  type="button"
                  onClick={() => removeFavorite(place.id)}
                  className="touch-target w-10 h-10 rounded-full text-chartrons-bordeaux"
                  aria-label={t('favorites.removeLabel', { name: place.title })}
                >
                  ♥
                </button>
              </div>
              <div className="flex flex-wrap gap-2 mt-3">
                {place.latitude != null && place.longitude != null && (
                  <>
                    <Link to={`/carte?pin=${encodeURIComponent(place.id)}`} onClick={onClose} className="flex-1">
                      <Button type="button" size="sm" variant="secondary" className="w-full">
                        {t('favorites.seeMap')}
                      </Button>
                    </Link>
                    <DirectionsButton latitude={place.latitude} longitude={place.longitude} />
                  </>
                )}
                <ShareButton
                  title={place.title}
                  text={placeShareText(place)}
                  url={appUrl(`/carte?pin=${encodeURIComponent(place.id)}`)}
                />
                <Link to={place.href} onClick={onClose} className="flex-1">
                  <Button type="button" size="sm" variant="secondary" className="w-full">
                    {t('favorites.open')}
                  </Button>
                </Link>
              </div>
            </li>
          ))}
          </ul>
        </>
      )}
    </Modal>
  );
}
