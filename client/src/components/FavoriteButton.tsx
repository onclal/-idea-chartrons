import { useTranslation } from 'react-i18next';
import { useFavorites } from '../context/FavoritesContext';
import { useToast } from '../context/ToastContext';
import type { FavoriteInput } from '../lib/favorites';

interface FavoriteButtonProps {
  place: FavoriteInput;
  className?: string;
}

export function FavoriteButton({ place, className = '' }: FavoriteButtonProps) {
  const { t } = useTranslation();
  const { isFavorite, toggleFavorite } = useFavorites();
  const { showToast } = useToast();
  const active = isFavorite(place.id);

  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const added = toggleFavorite(place);
    showToast(added ? t('favorites.added', { name: place.title }) : t('favorites.removed', { name: place.title }));
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      aria-pressed={active}
      aria-label={active ? t('favorites.removeLabel', { name: place.title }) : t('favorites.addLabel', { name: place.title })}
      title={active ? t('favorites.removeLabel', { name: place.title }) : t('favorites.addLabel', { name: place.title })}
      className={`touch-target w-11 h-11 shrink-0 rounded-full border flex items-center justify-center text-lg transition-colors ${
        active
          ? 'bg-chartrons-bordeaux/10 border-chartrons-bordeaux/30 text-chartrons-bordeaux'
          : 'bg-white border-chartrons-beige text-chartrons-warm-gray hover:border-chartrons-bordeaux/30'
      } ${className}`}
    >
      <span aria-hidden>{active ? '♥' : '♡'}</span>
    </button>
  );
}
