import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { getFideliteNiveau, type ActeurLocal, type PostAnnonce } from '@idea-chartrons/shared';
import { Badge, Button, Card, Loading } from '../components/ui';
import { AdminPanel } from '../components/AdminPanel';
import { CarnetSyncCard } from '../components/CarnetSyncCard';
import { FideliteHistory } from '../components/FideliteHistory';
import { FideliteScanner } from '../components/FideliteScanner';
import { LocalImpactCards } from '../components/LocalImpactCards';
import { PageHelp } from '../components/PageHelp';
import { QrCodeDisplay } from '../components/QrCodeDisplay';
import { ResidentReceipts } from '../components/ResidentReceipts';
import { useToast } from '../context/ToastContext';
import { api, type FideliteScanResult } from '../lib/api';
import {
  clearGuestTraces,
  getCarnetToken,
  getDeviceId,
  getOwnedPostIds,
} from '../lib/guestCarnet';
import { computeLocalImpact } from '../lib/localImpact';
import { loadReceipts, type ResidentReceipt } from '../lib/receipts';

/**
 * Tableau de bord habitant : reçus, fidélité et impact local, sans compte.
 */
export function CarnetPage() {
  const { t } = useTranslation();
  const { showToast } = useToast();
  const [deviceId, setDeviceId] = useState(getDeviceId);
  const [carnetToken, setCarnetToken] = useState(getCarnetToken);
  const [carnetPoints, setCarnetPoints] = useState(0);
  const [acteurs, setActeurs] = useState<ActeurLocal[]>([]);
  const [myPosts, setMyPosts] = useState<PostAnnonce[]>([]);
  const [receipts, setReceipts] = useState<ResidentReceipt[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(() => {
    setLoading(true);
    const ownedIds = new Set(getOwnedPostIds());
    Promise.all([api.getCarnetPoints(deviceId), api.getPosts(), api.getActeurs()])
      .then(([points, posts, acteursData]) => {
        setCarnetPoints(points);
        setMyPosts(posts.filter((post) => ownedIds.has(post.id)));
        setActeurs(acteursData);
        setReceipts(loadReceipts());
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [deviceId]);

  useEffect(load, [load]);

  const handleScanSuccess = (result: FideliteScanResult) => {
    setCarnetPoints(result.totalPoints);
    showToast(t('toast.pointsEarned', { points: result.pointsGagnes }));
    if (result.vipUnlocked) {
      window.setTimeout(() => showToast(t('toast.vipUnlocked', { offer: result.vipUnlocked }), 'info'), 400);
    }
  };

  const handleForget = () => {
    if (!window.confirm(t('carnet.forgetConfirm'))) return;
    clearGuestTraces();
    setDeviceId(getDeviceId());
    setCarnetToken(getCarnetToken());
    setMyPosts([]);
    setReceipts([]);
    setCarnetPoints(0);
    showToast(t('carnet.forgotten'));
  };

  if (loading) return <Loading message={t('common.loading')} />;

  const niveau = getFideliteNiveau(carnetPoints);
  const impact = computeLocalImpact();

  return (
    <div className="space-y-5 animate-fade-in">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h2 className="text-xl font-bold text-chartrons-bordeaux">{t('carnet.title')}</h2>
          <p className="text-sm text-chartrons-warm-gray mt-1">{t('carnet.subtitle')}</p>
        </div>
        <PageHelp page="carnet" />
      </div>

      <section className="space-y-3">
        <div>
          <h3 className="text-base font-bold text-chartrons-olive-dark">{t('carnet.receipts.title')}</h3>
          <p className="text-xs text-chartrons-warm-gray mt-0.5">{t('carnet.receipts.hint')}</p>
        </div>
        <ResidentReceipts receipts={receipts} />
      </section>

      <section className="space-y-3">
        <div>
          <h3 className="text-base font-bold text-chartrons-olive-dark">{t('carnet.loyalty.title')}</h3>
          <p className="text-xs text-chartrons-warm-gray mt-0.5">{t('carnet.loyalty.hint')}</p>
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

        <FideliteScanner
          acteurs={acteurs}
          deviceId={deviceId}
          carnetPoints={carnetPoints}
          compact
          onScanSuccess={handleScanSuccess}
        />
        <FideliteHistory deviceId={deviceId} carnetPoints={carnetPoints} key={`${deviceId}-${carnetPoints}`} />
      </section>

      <section className="space-y-3">
        <div>
          <h3 className="text-base font-bold text-chartrons-olive-dark">{t('carnet.impact.title')}</h3>
          <p className="text-xs text-chartrons-warm-gray mt-0.5">{t('carnet.impact.hint')}</p>
        </div>
        <LocalImpactCards stats={impact} />
      </section>

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
