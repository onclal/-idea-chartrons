import { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  getCreneauPlacesRestantes,
  getNextStatus,
  isCreneauBlocked,
  normalizeRelaisSettings,
  type LocalRelais,
  type PostAnnonce,
  type RelaisCreneau,
  type RelaisHorairesPlage,
  type RelaisSettings,
  type User,
} from '@idea-chartrons/shared';
import { AdminDataTable } from '../../components/admin/AdminDataTable';
import { AdminPageHeader } from '../../components/admin/AdminPageHeader';
import { Badge, Button, Card, EmptyState, Input, Loading } from '../../components/ui';
import { useToast } from '../../context/ToastContext';
import { api } from '../../lib/api';
import { formatDate } from '../../lib/format';

const WEEKDAY_ORDER = [1, 2, 3, 4, 5, 6, 0];

function emptyPlage(): RelaisHorairesPlage {
  return { heureDebut: '', heureFin: '' };
}

export function AdminRelaisPage() {
  const { t, i18n } = useTranslation();
  const { showToast } = useToast();
  const [relais, setRelais] = useState<LocalRelais[]>([]);
  const [posts, setPosts] = useState<PostAnnonce[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [creneaux, setCreneaux] = useState<RelaisCreneau[]>([]);
  const [loading, setLoading] = useState(true);
  const [showSettings, setShowSettings] = useState(false);
  const [savingSettings, setSavingSettings] = useState(false);
  const [togglingSlotId, setTogglingSlotId] = useState<string | null>(null);
  const [openingDays, setOpeningDays] = useState<number[]>([]);
  const [plages, setPlages] = useState<RelaisHorairesPlage[]>([emptyPlage(), emptyPlage()]);
  const [defaultCapacite, setDefaultCapacite] = useState(3);

  const applySettingsForm = (next: RelaisSettings) => {
    const normalized = normalizeRelaisSettings(next);
    setOpeningDays(normalized.openingDays);
    setPlages([
      normalized.plages[0] ?? emptyPlage(),
      normalized.plages[1] ?? emptyPlage(),
      ...normalized.plages.slice(2),
    ]);
    setDefaultCapacite(normalized.defaultCapacite);
  };

  const load = () => {
    setLoading(true);
    Promise.all([
      api.getRelais(),
      api.getPosts(),
      api.getUsers(),
      api.getAllCreneaux(),
      api.getRelaisSettings(),
    ])
      .then(([relaisData, postsData, usersData, creneauxData, settingsData]) => {
        setRelais(relaisData);
        setPosts(postsData);
        setUsers(usersData);
        setCreneaux(creneauxData);
        applySettingsForm(settingsData);
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

  const handleToggleSlot = async (slot: RelaisCreneau) => {
    setTogglingSlotId(slot.id);
    const nextBlocked = !isCreneauBlocked(slot);
    try {
      await api.setCreneauBlocked(slot.id, nextBlocked);
      const nextSlots = await api.getAllCreneaux();
      setCreneaux(nextSlots);
      showToast(nextBlocked ? t('toast.slotBlocked') : t('toast.slotUnblocked'));
    } catch (err) {
      showToast(err instanceof Error ? err.message : t('common.error'), 'error');
    } finally {
      setTogglingSlotId(null);
    }
  };

  const toggleDay = (day: number) => {
    setOpeningDays((current) =>
      current.includes(day) ? current.filter((item) => item !== day) : [...current, day].sort((a, b) => a - b),
    );
  };

  const handleSaveSettings = async () => {
    setSavingSettings(true);
    try {
      const saved = await api.updateRelaisSettings({
        openingDays,
        plages: plages.filter((plage) => plage.heureDebut && plage.heureFin),
        defaultCapacite,
      });
      applySettingsForm(saved);
      const nextSlots = await api.getAllCreneaux();
      setCreneaux(nextSlots);
      showToast(t('toast.relaisHoursSaved'));
    } catch (err) {
      showToast(err instanceof Error ? err.message : t('common.error'), 'error');
    } finally {
      setSavingSettings(false);
    }
  };

  const upcomingSlots = useMemo(
    () =>
      [...creneaux]
        .filter((c) => new Date(`${c.date}T23:59:59`).getTime() >= Date.now())
        .sort((a, b) => `${a.date}${a.heureDebut}${a.type}`.localeCompare(`${b.date}${b.heureDebut}${b.type}`)),
    [creneaux],
  );

  if (loading) return <Loading message={t('common.loading')} />;

  return (
    <div className="space-y-8 animate-fade-in">
      <AdminPageHeader
        title={t('adminSpace.nav.relais')}
        subtitle={t('adminSpace.pages.relaisSub')}
        action={
          <Button
            type="button"
            variant={showSettings ? 'secondary' : 'bordeaux'}
            size="sm"
            onClick={() => setShowSettings((open) => !open)}
          >
            {t('adminSpace.relaisSettings.open')}
          </Button>
        }
      />

      {showSettings && (
        <Card className="!p-4 sm:!p-5 space-y-4">
          <div>
            <h2 className="text-lg font-bold text-chartrons-bordeaux">{t('adminSpace.relaisSettings.title')}</h2>
            <p className="text-sm text-chartrons-warm-gray mt-1">{t('adminSpace.relaisSettings.hint')}</p>
          </div>

          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-chartrons-warm-gray mb-2">
              {t('adminSpace.relaisSettings.days')}
            </p>
            <div className="flex flex-wrap gap-2">
              {WEEKDAY_ORDER.map((day) => {
                const active = openingDays.includes(day);
                return (
                  <button
                    key={day}
                    type="button"
                    onClick={() => toggleDay(day)}
                    className={`px-3 py-2 rounded-full text-xs font-semibold border min-h-[36px] ${
                      active
                        ? 'bg-chartrons-bordeaux text-white border-chartrons-bordeaux'
                        : 'bg-white text-chartrons-warm-gray border-chartrons-beige'
                    }`}
                  >
                    {t(`adminSpace.relaisSettings.weekday.${day}`)}
                  </button>
                );
              })}
            </div>
          </div>

          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-chartrons-warm-gray mb-2">
              {t('adminSpace.relaisSettings.ranges')}
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {plages.slice(0, 2).map((plage, index) => (
                <div key={index} className="grid grid-cols-2 gap-2">
                  <Input
                    type="time"
                    label={
                      index === 0
                        ? t('adminSpace.relaisSettings.morningStart')
                        : t('adminSpace.relaisSettings.afternoonStart')
                    }
                    value={plage.heureDebut}
                    onChange={(event) => {
                      const value = event.target.value;
                      setPlages((current) =>
                        current.map((item, itemIndex) =>
                          itemIndex === index ? { ...item, heureDebut: value } : item,
                        ),
                      );
                    }}
                  />
                  <Input
                    type="time"
                    label={t('adminSpace.relaisSettings.rangeEnd')}
                    value={plage.heureFin}
                    onChange={(event) => {
                      const value = event.target.value;
                      setPlages((current) =>
                        current.map((item, itemIndex) =>
                          itemIndex === index ? { ...item, heureFin: value } : item,
                        ),
                      );
                    }}
                  />
                </div>
              ))}
            </div>
          </div>

          <Input
            type="number"
            min={1}
            max={30}
            label={t('adminSpace.relaisSettings.capacity')}
            value={String(defaultCapacite)}
            onChange={(event) => setDefaultCapacite(Number(event.target.value) || 1)}
          />

          <Button
            type="button"
            variant="bordeaux"
            className="w-full sm:w-auto"
            disabled={savingSettings}
            onClick={handleSaveSettings}
          >
            {savingSettings ? t('common.loading') : t('adminSpace.relaisSettings.save')}
          </Button>
        </Card>
      )}

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
        {upcomingSlots.length === 0 ? (
          <EmptyState icon="🗓️" message={t('relais.noSlots')} />
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3">
            {upcomingSlots.map((slot) => {
              const remaining = getCreneauPlacesRestantes(slot);
              const blocked = isCreneauBlocked(slot);
              return (
                <Card
                  key={slot.id}
                  className={`!p-4 space-y-3 ${blocked ? 'bg-chartrons-beige/50 border-chartrons-sand' : ''}`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-sm font-semibold text-chartrons-olive-dark">
                        {formatDate(slot.date, i18n.language)} · {slot.heureDebut}–{slot.heureFin}
                      </p>
                      <p className="text-xs text-chartrons-warm-gray mt-0.5">
                        {slot.type === 'Depot' ? t('adminSpace.fields.depot') : t('adminSpace.fields.pickup')}
                      </p>
                    </div>
                    <Badge variant={blocked ? 'brick' : remaining > 0 ? 'olive' : 'stone'}>
                      {blocked ? t('adminSpace.slots.closed') : t('relais.slotsRemaining', { count: remaining })}
                    </Badge>
                  </div>
                  <Button
                    type="button"
                    variant={blocked ? 'secondary' : 'ghost'}
                    size="sm"
                    className={`w-full ${blocked ? '' : 'border border-chartrons-beige'}`}
                    disabled={togglingSlotId === slot.id}
                    onClick={() => handleToggleSlot(slot)}
                  >
                    {blocked ? t('adminSpace.slots.unblock') : t('adminSpace.slots.block')}
                  </Button>
                </Card>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}
