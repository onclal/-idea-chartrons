import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ArdoiseStatus, type ActeurLocal } from '@idea-chartrons/shared';
import { AdminPageHeader } from './AdminPageHeader';
import { Badge, Button, Card, EmptyState, Loading } from '../ui';
import { useToast } from '../../context/ToastContext';
import { api } from '../../lib/api';
import { formatDateTime } from '../../lib/format';

const STATUS_VARIANT: Record<ArdoiseStatus, 'brass' | 'olive' | 'stone'> = {
  [ArdoiseStatus.Pending]: 'brass',
  [ArdoiseStatus.Approved]: 'olive',
  [ArdoiseStatus.Rejected]: 'stone',
};

/**
 * Modération des ardoises du jour proposées par les commerces VIP.
 * Une ardoise n'apparaît en vitrine qu'après validation ici.
 */
export function AdminArdoiseModeration() {
  const { t, i18n } = useTranslation();
  const { showToast } = useToast();
  const [acteurs, setActeurs] = useState<ActeurLocal[]>([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<string | null>(null);

  const load = () => {
    setLoading(true);
    api
      .getActeurs()
      .then((data) => setActeurs(data.filter((a) => a.dailyMenuText || a.dailyMenuImage)))
      .catch(console.error)
      .finally(() => setLoading(false));
  };

  useEffect(load, []);

  const decide = async (acteur: ActeurLocal, statut: ArdoiseStatus) => {
    setBusyId(acteur.id);
    try {
      const updated = await api.setArdoiseStatus(acteur.id, statut);
      setActeurs((list) => list.map((item) => (item.id === updated.id ? updated : item)));
      showToast(
        statut === ArdoiseStatus.Approved
          ? t('adminSpace.ardoises.approved')
          : t('adminSpace.ardoises.rejected'),
      );
    } catch (err) {
      showToast(err instanceof Error ? err.message : t('common.error'), 'error');
    } finally {
      setBusyId(null);
    }
  };

  if (loading) return <Loading message={t('common.loading')} />;

  const pending = acteurs.filter((a) => (a.dailyMenuStatus ?? ArdoiseStatus.Pending) === ArdoiseStatus.Pending);
  const reviewed = acteurs.filter((a) => (a.dailyMenuStatus ?? ArdoiseStatus.Pending) !== ArdoiseStatus.Pending);

  const renderCard = (acteur: ActeurLocal) => {
    const statut = acteur.dailyMenuStatus ?? ArdoiseStatus.Pending;
    return (
      <Card key={acteur.id} className="!p-4 space-y-3">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="font-semibold text-chartrons-olive-dark truncate">{acteur.nomCommerce}</p>
            <p className="text-xs text-chartrons-warm-gray">
              {acteur.dailyMenuSubmittedAt
                ? formatDateTime(acteur.dailyMenuSubmittedAt, i18n.language)
                : acteur.adresse}
            </p>
          </div>
          <Badge variant={STATUS_VARIANT[statut]}>{t(`adminSpace.ardoises.status.${statut}`)}</Badge>
        </div>

        {acteur.dailyMenuText && (
          <p className="text-sm text-chartrons-olive-dark leading-relaxed whitespace-pre-wrap rounded-xl bg-chartrons-beige/40 border border-chartrons-beige p-3">
            {acteur.dailyMenuText}
          </p>
        )}
        {acteur.dailyMenuImage && (
          <img
            src={acteur.dailyMenuImage}
            alt={t('acteurs.dailyMenu.alt', { name: acteur.nomCommerce })}
            className="w-full h-40 object-cover rounded-xl border border-chartrons-beige"
          />
        )}

        <div className="flex flex-wrap gap-2">
          <Button
            type="button"
            variant="bordeaux"
            size="sm"
            className="flex-1 min-w-[130px]"
            disabled={busyId === acteur.id || statut === ArdoiseStatus.Approved}
            onClick={() => decide(acteur, ArdoiseStatus.Approved)}
          >
            {t('adminSpace.ardoises.approve')}
          </Button>
          <Button
            type="button"
            variant="secondary"
            size="sm"
            className="flex-1 min-w-[130px]"
            disabled={busyId === acteur.id || statut === ArdoiseStatus.Rejected}
            onClick={() => decide(acteur, ArdoiseStatus.Rejected)}
          >
            {t('adminSpace.ardoises.reject')}
          </Button>
        </div>
      </Card>
    );
  };

  return (
    <div className="space-y-5">
      <AdminPageHeader
        title={t('adminSpace.ardoises.title')}
        subtitle={t('adminSpace.ardoises.subtitle')}
      />

      <section className="space-y-3">
        <h3 className="text-sm font-semibold uppercase tracking-wide text-chartrons-warm-gray">
          {t('adminSpace.ardoises.pendingTitle', { count: pending.length })}
        </h3>
        {pending.length === 0 ? (
          <EmptyState icon="🍽️" message={t('adminSpace.ardoises.empty')} />
        ) : (
          <div className="grid gap-3 lg:grid-cols-2">{pending.map(renderCard)}</div>
        )}
      </section>

      {reviewed.length > 0 && (
        <section className="space-y-3">
          <h3 className="text-sm font-semibold uppercase tracking-wide text-chartrons-warm-gray">
            {t('adminSpace.ardoises.reviewedTitle')}
          </h3>
          <div className="grid gap-3 lg:grid-cols-2">{reviewed.map(renderCard)}</div>
        </section>
      )}
    </div>
  );
}
