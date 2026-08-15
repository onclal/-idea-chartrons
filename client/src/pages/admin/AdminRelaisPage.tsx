import { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { getNextStatus, type LocalRelais, type PostAnnonce, type RelaisCreneau, type User } from '@idea-chartrons/shared';
import { AdminDataTable } from '../../components/admin/AdminDataTable';
import { AdminPageHeader } from '../../components/admin/AdminPageHeader';
import { Badge, Button, Card, EmptyState, Loading } from '../../components/ui';
import { useToast } from '../../context/ToastContext';
import { api } from '../../lib/api';
import { formatDate } from '../../lib/format';

export function AdminRelaisPage() {
  const { t, i18n } = useTranslation();
  const { showToast } = useToast();
  const [relais, setRelais] = useState<LocalRelais[]>([]);
  const [posts, setPosts] = useState<PostAnnonce[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [creneaux, setCreneaux] = useState<RelaisCreneau[]>([]);
  const [loading, setLoading] = useState(true);

  const load = () => {
    setLoading(true);
    Promise.all([api.getRelais(), api.getPosts(), api.getUsers(), api.getAllCreneaux()])
      .then(([relaisData, postsData, usersData, creneauxData]) => {
        setRelais(relaisData);
        setPosts(postsData);
        setUsers(usersData);
        setCreneaux(creneauxData);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  };

  useEffect(load, []);

  const postTitle = (id: string) => posts.find((p) => p.id === id)?.titre ?? id;
  const userName = (id: string) => users.find((u) => u.id === id)?.nom ?? id;
  const slotLabel = (id: string | null) => {
    if (!id) return '—';
    const slot = creneaux.find((c) => c.id === id);
    if (!slot) return id;
    return `${formatDate(slot.date, i18n.language)} ${slot.heureDebut}–${slot.heureFin}`;
  };

  const handleAdvance = async (item: LocalRelais) => {
    try {
      await api.avancerStatutRelais(item.id);
      load();
      showToast(t('toast.statusUpdated'));
    } catch (err) {
      showToast(err instanceof Error ? err.message : t('common.error'), 'error');
    }
  };

  const upcomingSlots = useMemo(
    () =>
      [...creneaux]
        .filter((c) => new Date(`${c.date}T23:59:59`).getTime() >= Date.now())
        .sort((a, b) => `${a.date}${a.heureDebut}`.localeCompare(`${b.date}${b.heureDebut}`))
        .slice(0, 12),
    [creneaux],
  );

  if (loading) return <Loading message={t('common.loading')} />;

  return (
    <div className="space-y-8 animate-fade-in">
      <AdminPageHeader
        title={t('adminSpace.nav.relais')}
        subtitle={t('adminSpace.pages.relaisSub')}
      />

      <AdminDataTable
        items={relais}
        empty={<EmptyState icon="📦" message={t('relais.noDepots')} />}
        columns={[
          {
            header: t('posts.create.titre'),
            render: (item) => (
              <div>
                <p className="font-medium text-chartrons-olive-dark">{postTitle(item.postId)}</p>
                <p className="text-xs text-chartrons-warm-gray">{userName(item.userId)}</p>
              </div>
            ),
          },
          {
            header: t('adminSpace.fields.status'),
            render: (item) => (
              <Badge variant={item.statutRetrait === 'Disponible_Au_Local' ? 'local' : 'stone'}>
                {t(`relais.status.${item.statutRetrait}`)}
              </Badge>
            ),
          },
          {
            header: t('adminSpace.fields.qr'),
            render: (item) => <span className="font-mono text-xs">{item.codeQrValidation}</span>,
          },
          {
            header: t('adminSpace.fields.depotSlot'),
            render: (item) => (
              <span className="text-chartrons-warm-gray whitespace-nowrap">{slotLabel(item.creneauDepotId)}</span>
            ),
          },
          {
            header: t('adminSpace.fields.actions'),
            render: (item) =>
              getNextStatus(item.statutRetrait) ? (
                <Button type="button" variant="secondary" size="sm" onClick={() => handleAdvance(item)}>
                  {t('relais.advanceStatus')}
                </Button>
              ) : (
                <span className="text-chartrons-warm-gray">—</span>
              ),
          },
        ]}
        mobileCard={(item) => (
          <Card key={item.id} className="!p-4 space-y-2">
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <p className="font-semibold text-chartrons-olive-dark">{postTitle(item.postId)}</p>
                <p className="text-xs text-chartrons-warm-gray">{userName(item.userId)}</p>
              </div>
              <Badge variant={item.statutRetrait === 'Disponible_Au_Local' ? 'local' : 'stone'}>
                {t(`relais.status.${item.statutRetrait}`)}
              </Badge>
            </div>
            <p className="text-xs font-mono text-chartrons-warm-gray">{item.codeQrValidation}</p>
            <p className="text-xs text-chartrons-warm-gray">
              {t('adminSpace.fields.depotSlot')}: {slotLabel(item.creneauDepotId)}
            </p>
            {getNextStatus(item.statutRetrait) && (
              <Button type="button" variant="secondary" size="sm" className="w-full" onClick={() => handleAdvance(item)}>
                {t('relais.advanceStatus')}
              </Button>
            )}
          </Card>
        )}
      />

      <section>
        <h2 className="text-lg font-bold text-chartrons-bordeaux mb-3">{t('adminSpace.pages.slots')}</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3">
          {upcomingSlots.map((slot) => {
            const remaining = slot.capacite - slot.reserves;
            return (
              <Card key={slot.id} className="!p-4 flex items-center justify-between gap-3">
                <div>
                  <p className="text-sm font-semibold text-chartrons-olive-dark">
                    {formatDate(slot.date, i18n.language)} · {slot.heureDebut}–{slot.heureFin}
                  </p>
                  <p className="text-xs text-chartrons-warm-gray mt-0.5">
                    {slot.type === 'Depot' ? t('adminSpace.fields.depot') : t('adminSpace.fields.pickup')}
                  </p>
                </div>
                <Badge variant={remaining > 0 ? 'olive' : 'stone'}>
                  {t('relais.slotsRemaining', { count: remaining })}
                </Badge>
              </Card>
            );
          })}
        </div>
      </section>
    </div>
  );
}
