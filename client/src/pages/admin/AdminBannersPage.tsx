import { useMemo, useState, type FormEvent } from 'react';
import { useTranslation } from 'react-i18next';
import { AdminDataTable } from '../../components/admin/AdminDataTable';
import { AdminPageHeader } from '../../components/admin/AdminPageHeader';
import { Badge, Button, Card, EmptyState, Input, Modal, Select } from '../../components/ui';
import { useToast } from '../../context/ToastContext';
import { loc } from '../../lib/locale';
import { toDatetimeLocal } from '../../lib/format';
import {
  BANNER_TARGETS,
  SMART_BANNER_ICONS,
  WEATHER_CONDITIONS,
  addSmartBanner,
  bannerIcon,
  emptySmartBanner,
  isAlertBanner,
  listSmartBanners,
  loadSmartBannerStore,
  removeSmartBanner,
  setBannerAudience,
  setSimulatedWeather,
  toggleSmartBanner,
  updateSmartBanner,
  type SmartBanner,
  type SmartBannerAudience,
  type SmartBannerTarget,
  type WeatherCondition,
} from '../../lib/smartBanners';

interface BannerForm {
  titleFr: string;
  titleEn: string;
  ctaFr: string;
  ctaEn: string;
  iconName: string;
  ctaUrl: string;
  targetAudience: SmartBannerTarget;
  weatherCondition: WeatherCondition;
  isActive: boolean;
  startAt: string;
  endAt: string;
}

const emptyForm = (): BannerForm => {
  const draft = emptySmartBanner();
  return {
    titleFr: '',
    titleEn: '',
    ctaFr: draft.ctaLabel.fr,
    ctaEn: draft.ctaLabel.en,
    iconName: draft.iconName,
    ctaUrl: draft.ctaUrl,
    targetAudience: draft.targetAudience,
    weatherCondition: draft.weatherCondition,
    isActive: true,
    startAt: '',
    endAt: '',
  };
};

function toForm(banner: SmartBanner): BannerForm {
  return {
    titleFr: banner.title.fr,
    titleEn: banner.title.en,
    ctaFr: banner.ctaLabel.fr,
    ctaEn: banner.ctaLabel.en,
    iconName: banner.iconName,
    ctaUrl: banner.ctaUrl,
    targetAudience: banner.targetAudience,
    weatherCondition: banner.weatherCondition,
    isActive: banner.isActive,
    startAt: banner.startAt ? toDatetimeLocal(banner.startAt) : '',
    endAt: banner.endAt ? toDatetimeLocal(banner.endAt) : '',
  };
}

function fromForm(form: BannerForm): Omit<SmartBanner, 'id'> {
  const toIso = (value: string): string | null => {
    if (!value) return null;
    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? null : date.toISOString();
  };
  return {
    title: { fr: form.titleFr.trim(), en: (form.titleEn || form.titleFr).trim() },
    iconName: form.iconName,
    ctaLabel: { fr: form.ctaFr.trim() || 'Voir', en: (form.ctaEn || form.ctaFr).trim() || 'See' },
    ctaUrl: form.ctaUrl.trim() || '/',
    targetAudience: form.targetAudience,
    weatherCondition: form.weatherCondition,
    isActive: form.isActive,
    startAt: toIso(form.startAt),
    endAt: toIso(form.endAt),
  };
}

export function AdminBannersPage() {
  const { t, i18n } = useTranslation();
  const { showToast } = useToast();
  const [store, setStore] = useState(() => loadSmartBannerStore());
  const [query, setQuery] = useState('');
  const [creating, setCreating] = useState(false);
  const [editing, setEditing] = useState<SmartBanner | null>(null);
  const [form, setForm] = useState<BannerForm>(emptyForm());

  const refresh = () => setStore(loadSmartBannerStore());

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return store.banners;
    return store.banners.filter((banner) => {
      const hay = `${banner.title.fr} ${banner.title.en} ${banner.ctaUrl} ${banner.targetAudience} ${banner.iconName}`.toLowerCase();
      return hay.includes(q);
    });
  }, [query, store.banners]);

  const openCreate = () => {
    setEditing(null);
    setForm(emptyForm());
    setCreating(true);
  };

  const openEdit = (banner: SmartBanner) => {
    setCreating(false);
    setEditing(banner);
    setForm(toForm(banner));
  };

  const closeModal = () => {
    setCreating(false);
    setEditing(null);
  };

  const handleSave = (e: FormEvent) => {
    e.preventDefault();
    if (!form.titleFr.trim()) return;
    const payload = fromForm(form);
    if (editing) {
      updateSmartBanner(editing.id, payload);
      showToast(t('adminSpace.saved'));
    } else {
      addSmartBanner(payload);
      showToast(t('adminSpace.saved'));
    }
    refresh();
    closeModal();
  };

  const handleToggle = (banner: SmartBanner) => {
    toggleSmartBanner(banner.id);
    refresh();
  };

  const handleDelete = (banner: SmartBanner) => {
    if (!window.confirm(t('adminSpace.banners.deleteConfirm', { title: loc(i18n.language, banner.title) }))) {
      return;
    }
    removeSmartBanner(banner.id);
    refresh();
    showToast(t('adminSpace.saved'));
  };

  const actions = (banner: SmartBanner) => (
    <div className="flex flex-wrap gap-2">
      <Button type="button" variant="secondary" size="sm" onClick={() => handleToggle(banner)}>
        {banner.isActive ? t('adminSpace.banners.deactivate') : t('adminSpace.banners.activate')}
      </Button>
      <Button type="button" variant="secondary" size="sm" onClick={() => openEdit(banner)}>
        {t('common.edit')}
      </Button>
      <Button
        type="button"
        variant="secondary"
        size="sm"
        className="border-chartrons-brick/30 text-chartrons-brick"
        onClick={() => handleDelete(banner)}
      >
        {t('common.delete')}
      </Button>
    </div>
  );

  return (
    <div className="animate-fade-in">
      <AdminPageHeader
        title={t('adminSpace.nav.banners')}
        subtitle={t('adminSpace.pages.bannersSub')}
        action={
          <Button variant="bordeaux" onClick={openCreate} className="w-full sm:w-auto">
            + {t('adminSpace.actions.create')}
          </Button>
        }
      />

      <Card className="!p-4 mb-5 space-y-4">
        <p className="text-sm text-chartrons-warm-gray leading-relaxed">{t('adminSpace.banners.previewHint')}</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Select
            label={t('adminSpace.banners.viewerAudience')}
            value={store.viewerAudience}
            onChange={(e) => {
              setStore(setBannerAudience(e.target.value as SmartBannerAudience));
            }}
            options={(['public', 'pro_free', 'pro_paid'] as const).map((audience) => ({
              value: audience,
              label: t(`adminSpace.banners.audience.${audience}`),
            }))}
          />
          <Select
            label={t('adminSpace.banners.simulatedWeather')}
            value={store.simulatedWeather}
            onChange={(e) => {
              setStore(setSimulatedWeather(e.target.value as WeatherCondition));
            }}
            options={WEATHER_CONDITIONS.map((weather) => ({
              value: weather,
              label: t(`adminSpace.banners.weather.${weather}`),
            }))}
          />
        </div>
      </Card>

      <div className="mb-4">
        <Input value={query} onChange={(e) => setQuery(e.target.value)} placeholder={t('common.search')} />
      </div>

      <AdminDataTable
        items={filtered}
        empty={
          <EmptyState
            icon="📢"
            title={t('adminSpace.banners.empty')}
            message={t('adminSpace.dashboard.empty')}
            action={{ label: `+ ${t('adminSpace.actions.create')}`, onClick: openCreate }}
          />
        }
        columns={[
          {
            header: t('adminSpace.banners.fields.title'),
            render: (banner) => (
              <div className="flex items-center gap-2 min-w-0">
                <span aria-hidden>{bannerIcon(banner.iconName)}</span>
                <p className="font-medium text-chartrons-olive-dark truncate max-w-sm">
                  {loc(i18n.language, banner.title)}
                </p>
              </div>
            ),
          },
          {
            header: t('adminSpace.banners.fields.audience'),
            render: (banner) => (
              <Badge variant="brass">{t(`adminSpace.banners.audience.${banner.targetAudience}`)}</Badge>
            ),
          },
          {
            header: t('adminSpace.fields.status'),
            render: (banner) => (
              <div className="flex flex-wrap gap-1.5">
                <Badge variant={banner.isActive ? 'olive' : 'gray'}>
                  {banner.isActive ? t('adminSpace.banners.active') : t('adminSpace.banners.inactive')}
                </Badge>
                {isAlertBanner(banner) && (
                  <Badge variant="brick">{t('adminSpace.banners.alert')}</Badge>
                )}
              </div>
            ),
          },
          { header: t('adminSpace.fields.actions'), render: actions },
        ]}
        mobileCard={(banner) => (
          <Card key={banner.id} className="!p-4">
            <div className="flex items-start gap-3">
              <span className="text-xl" aria-hidden>
                {bannerIcon(banner.iconName)}
              </span>
              <div className="min-w-0 flex-1">
                <p className="font-semibold text-chartrons-olive-dark">{loc(i18n.language, banner.title)}</p>
                <p className="text-xs text-chartrons-warm-gray mt-0.5">{banner.ctaUrl}</p>
                <div className="flex flex-wrap gap-1.5 mt-2">
                  <Badge variant="brass">{t(`adminSpace.banners.audience.${banner.targetAudience}`)}</Badge>
                  <Badge variant={banner.isActive ? 'olive' : 'gray'}>
                    {banner.isActive ? t('adminSpace.banners.active') : t('adminSpace.banners.inactive')}
                  </Badge>
                </div>
              </div>
            </div>
            <div className="mt-3">{actions(banner)}</div>
          </Card>
        )}
      />

      <Modal
        open={creating || !!editing}
        onClose={closeModal}
        title={editing ? t('adminSpace.actions.edit') : t('adminSpace.actions.create')}
        size="lg"
      >
        <form onSubmit={handleSave} className="space-y-4">
          <Input
            label={t('adminSpace.banners.fields.titleFr')}
            value={form.titleFr}
            onChange={(e) => setForm((f) => ({ ...f, titleFr: e.target.value }))}
            required
          />
          <Input
            label={t('adminSpace.banners.fields.titleEn')}
            value={form.titleEn}
            onChange={(e) => setForm((f) => ({ ...f, titleEn: e.target.value }))}
          />
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Select
              label={t('adminSpace.banners.fields.icon')}
              value={form.iconName}
              onChange={(e) => setForm((f) => ({ ...f, iconName: e.target.value }))}
              options={Object.entries(SMART_BANNER_ICONS).map(([name, icon]) => ({
                value: name,
                label: `${icon} ${name}`,
              }))}
            />
            <Select
              label={t('adminSpace.banners.fields.audience')}
              value={form.targetAudience}
              onChange={(e) => setForm((f) => ({ ...f, targetAudience: e.target.value as SmartBannerTarget }))}
              options={BANNER_TARGETS.map((audience) => ({
                value: audience,
                label: t(`adminSpace.banners.audience.${audience}`),
              }))}
            />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label={t('adminSpace.banners.fields.ctaFr')}
              value={form.ctaFr}
              onChange={(e) => setForm((f) => ({ ...f, ctaFr: e.target.value }))}
            />
            <Input
              label={t('adminSpace.banners.fields.ctaEn')}
              value={form.ctaEn}
              onChange={(e) => setForm((f) => ({ ...f, ctaEn: e.target.value }))}
            />
          </div>
          <Input
            label={t('adminSpace.banners.fields.ctaUrl')}
            value={form.ctaUrl}
            onChange={(e) => setForm((f) => ({ ...f, ctaUrl: e.target.value }))}
            placeholder="/events"
          />
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Select
              label={t('adminSpace.banners.fields.weather')}
              value={form.weatherCondition}
              onChange={(e) => setForm((f) => ({ ...f, weatherCondition: e.target.value as WeatherCondition }))}
              options={WEATHER_CONDITIONS.map((weather) => ({
                value: weather,
                label: t(`adminSpace.banners.weather.${weather}`),
              }))}
            />
            <Select
              label={t('adminSpace.fields.status')}
              value={form.isActive ? '1' : '0'}
              onChange={(e) => setForm((f) => ({ ...f, isActive: e.target.value === '1' }))}
              options={[
                { value: '1', label: t('adminSpace.banners.active') },
                { value: '0', label: t('adminSpace.banners.inactive') },
              ]}
            />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label={t('adminSpace.fields.start')}
              type="datetime-local"
              value={form.startAt}
              onChange={(e) => setForm((f) => ({ ...f, startAt: e.target.value }))}
            />
            <Input
              label={t('adminSpace.fields.end')}
              type="datetime-local"
              value={form.endAt}
              onChange={(e) => setForm((f) => ({ ...f, endAt: e.target.value }))}
            />
          </div>
          <p className="text-[11px] text-chartrons-warm-gray leading-snug">{t('adminSpace.banners.weatherHint')}</p>
          <div className="flex flex-col-reverse sm:flex-row gap-2 pt-2">
            <Button type="button" variant="secondary" className="flex-1" onClick={closeModal}>
              {t('common.cancel')}
            </Button>
            <Button type="submit" variant="bordeaux" className="flex-1">
              {t('common.save')}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
