import { useCallback, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import type { LocalRelais, PostAnnonce } from '@idea-chartrons/shared';
import { Loading } from '../components/ui';
import { LocalRelaisCard } from '../components/LocalRelaisCard';
import { PickupAlert } from '../components/PickupAlert';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { api } from '../lib/api';

export function RelaisPage() {
  const { t } = useTranslation();
  const { currentUserId, isRelaisStaff } = useAuth();
  const { showToast } = useToast();
  const [relaisList, setRelaisList] = useState<LocalRelais[]>([]);
  const [posts, setPosts] = useState<PostAnnonce[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedQr, setSelectedQr] = useState<string | null>(null);

  const loadData = useCallback(() => {
    setLoading(true);
    Promise.all([api.getRelais(), api.getPosts()])
      .then(([relais, postsData]) => {
        setRelaisList(relais);
        setPosts(postsData);
        const ready = relais.find((r) => r.statutRetrait === 'Disponible_Au_Local');
        setSelectedQr(ready?.codeQrValidation ?? relais[0]?.codeQrValidation ?? null);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  useEffect(loadData, [currentUserId]);

  const handleReserverRetrait = async (relaisId: string, creneauId: string) => {
    try {
      await api.reserverRetrait(relaisId, creneauId);
      loadData();
      showToast(t('toast.pickupReserved'));
    } catch (err) {
      showToast(err instanceof Error ? err.message : t('common.error'), 'error');
    }
  };

  const handleAvancerStatut = async (relaisId: string) => {
    try {
      await api.avancerStatutRelais(relaisId);
      loadData();
      showToast(t('toast.statusUpdated'));
    } catch (err) {
      showToast(err instanceof Error ? err.message : t('common.error'), 'error');
    }
  };

  if (loading) return <Loading message={t('common.loading')} />;

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-xl font-bold text-chartrons-bordeaux">{t('relais.pageTitle')}</h2>
        <p className="text-sm text-chartrons-warm-gray mt-1">{t('relais.pageDescription')}</p>
      </div>

      <PickupAlert relaisList={relaisList} posts={posts} userId={currentUserId} />

      <LocalRelaisCard
        relaisList={relaisList}
        posts={posts}
        selectedQr={selectedQr}
        onSelectQr={setSelectedQr}
        onReserverRetrait={handleReserverRetrait}
        onAvancerStatut={handleAvancerStatut}
        isAdmin={isRelaisStaff}
      />

      <div className="rounded-2xl bg-chartrons-green/5 border border-chartrons-green/10 p-4">
        <h4 className="text-sm font-semibold text-chartrons-green-dark mb-2">
          {t('relais.hours')}
        </h4>
        <ul className="text-sm text-chartrons-warm-gray space-y-1">
          <li>{t('relais.hoursWeek')}</li>
          <li>{t('relais.hoursSat')}</li>
        </ul>
      </div>
    </div>
  );
}
