import { Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Badge, Button, Card, EmptyState } from '../components/ui';
import { PageHelp } from '../components/PageHelp';
import { useFavorites } from '../context/FavoritesContext';

export function FavoritesPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { favorites, removeFavorite } = useFavorites();

  return (
    <div className="space-y-4 animate-fade-in">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <h2 className="text-xl font-bold text-chartrons-bordeaux">{t('favorites.title')}</h2>
          <p className="text-sm text-chartrons-warm-gray mt-1">{t('favorites.subtitle')}</p>
        </div>
        <PageHelp page="favoris" />
      </div>

      {favorites.length === 0 ? (
        <EmptyState
          icon="♡"
          title={t('favorites.emptyTitle')}
          message={t('favorites.emptyHint')}
          action={{ label: t('favorites.goMap'), onClick: () => navigate('/carte') }}
        />
      ) : (
        <div className="space-y-3">
          {favorites.map((place) => (
            <Card key={place.id} className="!p-4">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <h3 className="font-semibold text-chartrons-olive-dark">{place.title}</h3>
                  <div className="mt-1.5">
                    <Badge variant="olive">{place.subtitle}</Badge>
                  </div>
                  <p className="text-xs text-chartrons-warm-gray mt-2">📍 {place.adresse}</p>
                </div>
                <button
                  type="button"
                  onClick={() => removeFavorite(place.id)}
                  className="touch-target w-11 h-11 shrink-0 rounded-full bg-chartrons-bordeaux/10 text-chartrons-bordeaux"
                  aria-label={t('favorites.removeLabel', { name: place.title })}
                >
                  ♥
                </button>
              </div>
              <div className="flex gap-2 mt-3">
                {place.latitude != null && place.longitude != null && (
                  <Link to={`/carte?pin=${encodeURIComponent(place.id)}`} className="flex-1">
                    <Button type="button" size="sm" variant="bordeaux" className="w-full">
                      {t('favorites.seeMap')}
                    </Button>
                  </Link>
                )}
                <Link to={place.href} className="flex-1">
                  <Button type="button" size="sm" variant="secondary" className="w-full">
                    {t('favorites.open')}
                  </Button>
                </Link>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
