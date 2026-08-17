import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { getFideliteNiveau, type PostAnnonce } from '@idea-chartrons/shared';
import { Badge, Button, Card, Loading } from '../components/ui';
import { AdminPanel } from '../components/AdminPanel';
import { CarnetSyncCard } from '../components/CarnetSyncCard';
import { FideliteHistory } from '../components/FideliteHistory';
import { PageHelp } from '../components/PageHelp';
import { QrCodeDisplay } from '../components/QrCodeDisplay';
import { useToast } from '../context/ToastContext';
import { api } from '../lib/api';
import {
  clearGuestTraces,
  getCarnetToken,
  getDeviceId,
  getOwnedPostIds,
} from '../lib/guestCarnet';

/**
 * Carnet de quartier : l'équivalent invité d'un profil.
 * Points, contributions et préférences vivent dans cet appareil, jamais dans un compte.
 */
export function CarnetPage() {
  const { t } = useTranslation();
  const { showToast } = useToast();
  const [deviceId, setDeviceId] = useState(getDeviceId);
  const [carnetToken, setCarnetToken] = useState(getCarnetToken);
  const [carnetPoints, setCarnetPoints] = useState(0);
  const [myPosts, setMyPosts] = useState<PostAnnonce[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(() => {
    setLoading(true);
    const ownedIds = new Set(getOwnedPostIds());
    Promise.all([api.getCarnetPoints(deviceId), api.getPosts()])
      .then(([points, posts]) => {
        setCarnetPoints(points);
        setMyPosts(posts.filter((post) => ownedIds.has(post.id)));
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [deviceId]);

  useEffect(load, [load]);

  const handleForget = () => {
    if (!window.confirm(t('carnet.forgetConfirm'))) return;
    clearGuestTraces();
    setDeviceId(getDeviceId());
    setCarnetToken(getCarnetToken());
    setMyPosts([]);
    showToast(t('carnet.forgotten'));
  };

  if (loading) return <Loading message={t('common.loading')} />;

  const niveau = getFideliteNiveau(carnetPoints);

  return (
    <div className="space-y-4 animate-fade-in">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h2 className="text-xl font-bold text-chartrons-bordeaux">{t('carnet.title')}</h2>
          <p className="text-sm text-chartrons-warm-gray mt-1">{t('carnet.subtitle')}</p>
        </div>
        <PageHelp page="carnet" />
      </div>

      <Card className="!p-4 space-y-4 bg-gradient-to-br from-chartrons-beige/60 to-white">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-3xl font-bold text-chartrons-brass leading-none">{carnetPoints}</p>
            <p className="text-[10px] font-semibold uppercase tracking-wide text-chartrons-warm-gray mt-1">
              {t('fidelite.yourPoints')}
            </p>
          </div>
          <Badge variant="brass">{t(`fidelite.levels.${niveau}`)}</Badge>
        </div>
        <div className="flex flex-col items-center gap-2 pt-2 border-t border-chartrons-beige">
          <QrCodeDisplay value={carnetToken} label={carnetToken} />
          <p className="text-xs text-chartrons-warm-gray text-center leading-relaxed">
            {t('carnet.tokenHint')}
          </p>
        </div>
      </Card>

      <FideliteHistory deviceId={deviceId} carnetPoints={carnetPoints} />

      <Card className="!p-4">
        <h3 className="text-sm font-semibold text-chartrons-olive-dark mb-1">
          {t('carnet.myPosts')}
        </h3>
        <p className="text-xs text-chartrons-warm-gray mb-3">{t('carnet.myPostsHint')}</p>
        {myPosts.length === 0 ? (
          <p className="text-sm text-chartrons-warm-gray">{t('carnet.noPosts')}</p>
        ) : (
          <ul className="space-y-2">
            {myPosts.map((post) => (
              <li
                key={post.id}
                className="flex items-center justify-between gap-3 rounded-xl border border-chartrons-beige bg-white px-3 py-2"
              >
                <span className="text-sm font-medium text-chartrons-olive-dark truncate">
                  {post.titre}
                </span>
                <Badge variant={post.statut === 'Disponible' ? 'olive' : 'stone'}>
                  {t(`posts.status.${post.statut}`)}
                </Badge>
              </li>
            ))}
          </ul>
        )}
        <Link to="/posts" className="block mt-3">
          <Button type="button" variant="secondary" size="sm" className="w-full">
            {t('carnet.openPosts')}
          </Button>
        </Link>
      </Card>

      <CarnetSyncCard />

      <Card className="!p-4">
        <h3 className="text-sm font-semibold text-chartrons-olive-dark mb-1">
          {t('carnet.privacyTitle')}
        </h3>
        <p className="text-xs text-chartrons-warm-gray mb-3 leading-relaxed">
          {t('carnet.privacyHint')}
        </p>
        <Button type="button" variant="secondary" size="sm" className="w-full" onClick={handleForget}>
          {t('carnet.forget')}
        </Button>
      </Card>

      <AdminPanel />
    </div>
  );
}
