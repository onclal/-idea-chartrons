import { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ActeurLocalCategory, type ActeurLocal, type User } from '@idea-chartrons/shared';
import { Badge, Card, EmptyState, Loading } from '../components/ui';
import { FideliteScanner } from '../components/FideliteScanner';
import { FideliteHistory } from '../components/FideliteHistory';
import { QrCodeDisplay } from '../components/QrCodeDisplay';
import { VipOfferCard } from '../components/VipOfferCard';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { matchesSearch, useSearch } from '../context/SearchContext';
import { api, type FideliteScanResult } from '../lib/api';

const CATEGORY_FILTERS = ['all', ...Object.values(ActeurLocalCategory)] as const;
type CategoryFilter = (typeof CATEGORY_FILTERS)[number];

export function ActeursPage() {
  const { t } = useTranslation();
  const { query } = useSearch();
  const { currentUser, currentUserId, refreshUser } = useAuth();
  const { showToast } = useToast();
  const [acteurs, setActeurs] = useState<ActeurLocal[]>([]);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [categoryFilter, setCategoryFilter] = useState<CategoryFilter>('all');

  useEffect(() => {
    Promise.all([api.getActeurs(), api.getUser(currentUserId)])
      .then(([acteursData, userData]) => {
        setActeurs(acteursData);
        setUser(userData);
        if (acteursData[0]) setExpandedId(acteursData[0].id);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [currentUserId]);

  const filteredActeurs = useMemo(
    () =>
      acteurs.filter((a) => {
        const matchesCategory = categoryFilter === 'all' || a.categorie === categoryFilter;
        const matchesQuery =
          matchesSearch(a.nomCommerce, query) ||
          matchesSearch(a.description, query) ||
          matchesSearch(a.adresse, query);
        return matchesCategory && matchesQuery;
      }),
    [acteurs, query, categoryFilter],
  );

  const handleScanSuccess = async (result: FideliteScanResult) => {
    setUser((u) => (u ? { ...u, pointsFidelite: result.totalPoints } : u));
    await refreshUser();
    showToast(t('toast.pointsEarned', { points: result.pointsGagnes }));
    if (result.vipUnlocked) {
      setTimeout(() => showToast(t('toast.vipUnlocked', { offer: result.vipUnlocked }), 'info'), 400);
    }
  };

  if (loading) return <Loading message={t('common.loading')} />;

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-xl font-bold text-chartrons-bordeaux">{t('acteurs.title')}</h2>
        <p className="text-sm text-chartrons-warm-gray mt-1">{t('acteurs.subtitle')}</p>
        {query && (
          <p className="text-xs text-chartrons-warm-gray mt-0.5">
            {t('search.results', { count: filteredActeurs.length, query })}
          </p>
        )}
      </div>

      <FideliteScanner
        acteurs={acteurs}
        userId={currentUserId}
        userPoints={user?.pointsFidelite ?? currentUser?.pointsFidelite ?? 0}
        onScanSuccess={handleScanSuccess}
      />

      <FideliteHistory userId={currentUserId} userPoints={user?.pointsFidelite ?? 0} />

      <div className="flex gap-2 overflow-x-auto pb-1 -mx-1 px-1">
        {CATEGORY_FILTERS.map((cat) => (
          <button
            key={cat}
            onClick={() => setCategoryFilter(cat)}
            className={`shrink-0 touch-target px-4 py-2 rounded-full text-xs font-semibold border transition-all ${
              categoryFilter === cat
                ? 'bg-chartrons-bordeaux text-white border-chartrons-bordeaux'
                : 'bg-white text-chartrons-olive-dark border-chartrons-beige'
            }`}
          >
            {cat === 'all' ? t('acteurs.filters.all') : t(`acteurs.categories.${cat}`)}
          </button>
        ))}
      </div>

      {filteredActeurs.length === 0 ? (
        <EmptyState
          icon={query ? '🔍' : '🏪'}
          title={query ? t('search.noResultsTitle') : t('acteurs.emptyTitle')}
          message={query ? t('search.noResultsHint') : t('acteurs.emptyHint')}
        />
      ) : (
        <div className="space-y-3">
          {filteredActeurs.map((acteur) => {
            const isExpanded = expandedId === acteur.id;
            return (
              <Card
                key={acteur.id}
                className="!p-0 overflow-hidden cursor-pointer"
                onClick={() => setExpandedId(isExpanded ? null : acteur.id)}
              >
                {acteur.photos[0] && (
                  <img src={acteur.photos[0]} alt="" className="w-full h-40 object-cover" />
                )}
                <div className="p-4">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <h3 className="font-semibold text-chartrons-olive-dark text-base">{acteur.nomCommerce}</h3>
                      <div className="flex flex-wrap gap-1.5 mt-1.5">
                        <Badge variant="olive">{t(`acteurs.categories.${acteur.categorie}`)}</Badge>
                        {acteur.offreVip && (
                          <Badge variant="vip" icon="⭐">{t('badges.vip')}</Badge>
                        )}
                      </div>
                    </div>
                    <span className="text-chartrons-warm-gray text-sm">{isExpanded ? '▲' : '▼'}</span>
                  </div>

                  <p className="text-sm text-chartrons-warm-gray mt-2">{acteur.description}</p>
                  <p className="text-xs text-chartrons-warm-gray/70 mt-2">📍 {acteur.adresse}</p>

                  <VipOfferCard acteur={acteur} userPoints={user?.pointsFidelite ?? 0} />

                  {isExpanded && (
                    <div className="mt-4 pt-4 border-t border-chartrons-gold/10 flex flex-col items-center gap-2">
                      <p className="text-xs font-medium text-chartrons-warm-gray">
                        {t('acteurs.qrVitrine')}
                      </p>
                      <QrCodeDisplay
                        value={acteur.qrCodeVitrine}
                        label={acteur.qrCodeVitrine}
                        size={140}
                      />
                      <p className="text-[10px] text-chartrons-warm-gray text-center">
                        {t('acteurs.qrHint')}
                      </p>
                    </div>
                  )}
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
