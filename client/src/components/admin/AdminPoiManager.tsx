import { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  ActeurLocalCategory,
  CHARTRONS_SUBCATEGORIES,
  CHARTRONS_SUBCATEGORY_LABELS,
  classifySubcategory,
  isPremiumProMerchant,
  matchesSearchQuery,
  merchantTierOf,
  merchantTierPatch,
  type ActeurLocal,
  type ChartronsSubcategory,
  type MerchantTier,
} from '@idea-chartrons/shared';
import { AdminDataTable } from './AdminDataTable';
import { AdminPageHeader } from './AdminPageHeader';
import { AdminPhotoField } from './AdminPhotoField';
import { Badge, Button, Card, EmptyState, Input, Loading, Modal, Select, Textarea } from '../ui';
import { StorefrontPoster } from '../StorefrontPoster';
import { useToast } from '../../context/ToastContext';
import { api } from '../../lib/api';
import { loc } from '../../lib/locale';

interface ActeurForm {
  nomCommerce: string;
  categorie: ActeurLocalCategory;
  subcategory: ChartronsSubcategory;
  description: string;
  adresse: string;
  photo: string;
  offreVip: string;
  pointsRequisVip: string;
  telephone: string;
  activerFidelite: boolean;
  tier: MerchantTier;
  hasDelivery: boolean;
  wheelchairAccessible: boolean;
  seniorFriendly: boolean;
}

const emptyForm = (): ActeurForm => ({
  nomCommerce: '',
  categorie: ActeurLocalCategory.CommercesArtisanat,
  subcategory: classifySubcategory('', ActeurLocalCategory.CommercesArtisanat),
  description: '',
  adresse: '',
  telephone: '',
  photo: '',
  offreVip: '',
  pointsRequisVip: '50',
  activerFidelite: false,
  tier: 'free',
  hasDelivery: false,
  wheelchairAccessible: false,
  seniorFriendly: false,
});

/** Les fiches créées avant la taxonomie unifiée peuvent ne pas porter de sous-catégorie. */
const resolveSubcategory = (acteur: ActeurLocal): ChartronsSubcategory => {
  const current: ChartronsSubcategory | undefined = acteur.subcategory;
  return current ?? classifySubcategory(acteur.specialite ?? '', acteur.categorie);
};

export function AdminPoiManager() {
  const { t, i18n } = useTranslation();
  const { showToast } = useToast();
  const [acteurs, setActeurs] = useState<ActeurLocal[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState('');
  const [tierFilter, setTierFilter] = useState<MerchantTier | 'all'>('all');
  const [editing, setEditing] = useState<ActeurLocal | null>(null);
  const [creating, setCreating] = useState(false);
  const [form, setForm] = useState<ActeurForm>(emptyForm());
  const [saving, setSaving] = useState(false);
  const [posterActeur, setPosterActeur] = useState<ActeurLocal | null>(null);

  const load = () => {
    setLoading(true);
    api
      .getActeurs()
      .then(setActeurs)
      .catch(console.error)
      .finally(() => setLoading(false));
  };

  useEffect(load, []);

  const filtered = useMemo(() => {
    return acteurs.filter((a) => {
      if (tierFilter !== 'all' && merchantTierOf(a) !== tierFilter) return false;
      return matchesSearchQuery(
        `${a.nomCommerce} ${a.description} ${a.adresse} ${a.telephone ?? ''} ${a.specialite ?? ''}`,
        query,
      );
    });
  }, [acteurs, query, tierFilter]);

  const openCreate = () => {
    setEditing(null);
    setForm(emptyForm());
    setCreating(true);
  };

  const openEdit = (acteur: ActeurLocal) => {
    setCreating(false);
    setEditing(acteur);
    setForm({
      nomCommerce: acteur.nomCommerce,
      categorie: acteur.categorie,
      subcategory: resolveSubcategory(acteur),
      description: acteur.description,
      adresse: acteur.adresse,
      telephone: acteur.telephone ?? '',
      photo: acteur.photos[0] ?? '',
      offreVip: acteur.offreVip ?? '',
      pointsRequisVip: String(acteur.pointsRequisVip),
      activerFidelite: Boolean(acteur.qrCodeVitrine),
      tier: merchantTierOf(acteur),
      hasDelivery: Boolean(acteur.hasDelivery),
      wheelchairAccessible: Boolean(acteur.wheelchairAccessible),
      seniorFriendly: Boolean(acteur.seniorFriendly),
    });
  };

  const closeModal = () => {
    setCreating(false);
    setEditing(null);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const payload = {
        nomCommerce: form.nomCommerce,
        categorie: form.categorie,
        subcategory: form.subcategory,
        description: form.description,
        adresse: form.adresse,
        telephone: form.telephone.trim() || null,
        photos: form.photo ? [form.photo] : [],
        offreVip: form.offreVip.trim() || null,
        pointsRequisVip: Number(form.pointsRequisVip) || 0,
      };
      if (editing) {
        await api.updateActeur(editing.id, {
          ...payload,
          ...merchantTierPatch(form.tier),
          hasDelivery: form.hasDelivery,
          wheelchairAccessible: form.wheelchairAccessible,
          seniorFriendly: form.seniorFriendly,
        });
        if (form.activerFidelite && !editing.qrCodeVitrine) {
          await api.generateQrVitrine(editing.id);
        }
      } else {
        const created = await api.createActeur({ ...payload, activerFidelite: form.activerFidelite });
        await api.updateActeur(created.id, {
          ...merchantTierPatch(form.tier === 'premium_pro' ? 'premium_pro' : 'free'),
          hasDelivery: form.hasDelivery,
          wheelchairAccessible: form.wheelchairAccessible,
          seniorFriendly: form.seniorFriendly,
        });
      }
      showToast(t('adminSpace.saved'));
      closeModal();
      load();
    } catch (err) {
      showToast(err instanceof Error ? err.message : t('common.error'), 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleToggleTier = async (acteur: ActeurLocal) => {
    const next: MerchantTier = isPremiumProMerchant(acteur) ? 'free' : 'premium_pro';
    try {
      await api.updateActeur(acteur.id, merchantTierPatch(next));
      showToast(t('adminSpace.toasts.tierUpdated', { name: acteur.nomCommerce }));
      load();
    } catch (err) {
      showToast(err instanceof Error ? err.message : t('common.error'), 'error');
    }
  };

  const handleDelete = async (acteur: ActeurLocal) => {
    if (!window.confirm(t('admin.deleteActeurConfirm', { name: acteur.nomCommerce }))) return;
    await api.deleteActeur(acteur.id);
    load();
    showToast(t('admin.deleteSuccess'));
  };

  if (loading) return <Loading message={t('common.loading')} />;

  const actions = (acteur: ActeurLocal) => (
    <div className="flex flex-wrap gap-2">
      <Button type="button" variant="secondary" size="sm" onClick={() => openEdit(acteur)}>
        {t('common.edit')}
      </Button>
      <Button type="button" variant="gold" size="sm" onClick={() => setPosterActeur(acteur)}>
        {t('poster.open')}
      </Button>
      <Button type="button" variant="gold" size="sm" onClick={() => void handleToggleTier(acteur)}>
        {isPremiumProMerchant(acteur) ? t('adminSpace.actions.setFree') : t('adminSpace.actions.setPro')}
      </Button>
      <Button
        type="button"
        variant="secondary"
        size="sm"
        className="border-chartrons-brick/30 text-chartrons-brick"
        onClick={() => handleDelete(acteur)}
      >
        {t('common.delete')}
      </Button>
    </div>
  );

  return (
    <div className="animate-fade-in">
      <AdminPageHeader
        title={t('adminSpace.panel.tabs.pois')}
        subtitle={t('adminSpace.pages.acteursSub')}
        action={
          <Button variant="bordeaux" onClick={openCreate} className="w-full sm:w-auto">
            + {t('adminSpace.actions.create')}
          </Button>
        }
      />

      <div className="mb-4 grid grid-cols-1 sm:grid-cols-2 gap-3">
        <Input value={query} onChange={(e) => setQuery(e.target.value)} placeholder={t('common.search')} />
        <Select
          value={tierFilter}
          onChange={(e) => setTierFilter(e.target.value as MerchantTier | 'all')}
          options={[
            { value: 'all', label: t('adminSpace.tier.all') },
            { value: 'free', label: t('adminSpace.tier.free') },
            { value: 'premium_pro', label: t('adminSpace.tier.premium_pro') },
          ]}
        />
      </div>

      <AdminDataTable
        items={filtered}
        empty={
          <EmptyState
            icon="🏪"
            title={t('acteurs.emptyTitle')}
            message={t('adminSpace.dashboard.empty')}
            action={{ label: `+ ${t('adminSpace.actions.create')}`, onClick: openCreate }}
          />
        }
        columns={[
          {
            header: t('adminSpace.fields.commerce'),
            render: (acteur) => (
              <div className="flex items-center gap-3 min-w-0">
                {acteur.photos[0] && (
                  <img src={acteur.photos[0]} alt="" className="w-12 h-12 rounded-xl object-cover shrink-0" />
                )}
                <div className="min-w-0">
                  <p className="font-medium text-chartrons-olive-dark truncate max-w-xs">{acteur.nomCommerce}</p>
                  <p className="text-xs text-chartrons-warm-gray truncate">{acteur.adresse}</p>
                </div>
              </div>
            ),
          },
          {
            header: t('adminSpace.fields.category'),
            render: (acteur) => (
              <div className="flex flex-wrap gap-1.5">
                <Badge variant="olive">{t(`acteurs.categories.${acteur.categorie}`)}</Badge>
                <Badge variant="brass">
                  {loc(i18n.language, CHARTRONS_SUBCATEGORY_LABELS[resolveSubcategory(acteur)])}
                </Badge>
              </div>
            ),
          },
          {
            header: t('adminSpace.fields.tier'),
            render: (acteur) =>
              isPremiumProMerchant(acteur) ? (
                <Badge variant="vip" icon="⭐">
                  {t('adminSpace.tier.premium_pro')}
                </Badge>
              ) : (
                <Badge variant="stone">{t('adminSpace.tier.free')}</Badge>
              ),
          },
          {
            header: t('acteurs.vip'),
            render: (acteur) =>
              acteur.offreVip ? (
                <span className="text-xs text-chartrons-olive-dark">
                  {acteur.offreVip} · {acteur.pointsRequisVip} pts
                </span>
              ) : (
                <span className="text-chartrons-warm-gray">—</span>
              ),
          },
          {
            header: t('adminSpace.fields.qr'),
            render: (acteur) =>
              acteur.qrCodeVitrine ? (
                <Badge variant="green">{t('acteurs.qrActive')}</Badge>
              ) : (
                <Badge variant="stone">{t('acteurs.qrOptional')}</Badge>
              ),
          },
          { header: t('adminSpace.fields.actions'), render: actions },
        ]}
        mobileCard={(acteur) => (
          <Card key={acteur.id} className="!p-4">
            <div className="flex gap-3">
              {acteur.photos[0] && (
                <img src={acteur.photos[0]} alt="" className="w-16 h-16 rounded-xl object-cover shrink-0" />
              )}
              <div className="min-w-0 flex-1">
                <p className="font-semibold text-chartrons-olive-dark">{acteur.nomCommerce}</p>
                <p className="text-xs text-chartrons-warm-gray mt-0.5">{acteur.adresse}</p>
                <div className="flex flex-wrap gap-1.5 mt-2">
                  <Badge variant="olive">{t(`acteurs.categories.${acteur.categorie}`)}</Badge>
                  <Badge variant="brass">
                    {loc(i18n.language, CHARTRONS_SUBCATEGORY_LABELS[resolveSubcategory(acteur)])}
                  </Badge>
                  <Badge variant={isPremiumProMerchant(acteur) ? 'vip' : 'stone'}>
                    {isPremiumProMerchant(acteur)
                      ? t('adminSpace.tier.premium_pro')
                      : t('adminSpace.tier.free')}
                  </Badge>
                  {acteur.offreVip && (
                    <Badge variant="vip" icon="⭐">
                      {t('badges.vip')}
                    </Badge>
                  )}
                  <Badge variant={acteur.qrCodeVitrine ? 'green' : 'stone'}>
                    {acteur.qrCodeVitrine ? t('acteurs.qrActive') : t('acteurs.qrOptional')}
                  </Badge>
                </div>
              </div>
            </div>
            <div className="mt-3">{actions(acteur)}</div>
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
            label={t('adminSpace.fields.commerce')}
            value={form.nomCommerce}
            onChange={(e) => setForm((f) => ({ ...f, nomCommerce: e.target.value }))}
            required
          />
          <Textarea
            label={t('posts.create.description')}
            value={form.description}
            onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
            required
            rows={3}
          />
          <Input
            label={t('adminSpace.fields.address')}
            value={form.adresse}
            onChange={(e) => setForm((f) => ({ ...f, adresse: e.target.value }))}
            required
          />
          <Input
            label={t('common.phone')}
            type="tel"
            value={form.telephone}
            onChange={(e) => setForm((f) => ({ ...f, telephone: e.target.value }))}
            placeholder={t('common.phonePlaceholder')}
          />
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Select
              label={t('adminSpace.fields.category')}
              value={form.categorie}
              onChange={(e) => setForm((f) => ({ ...f, categorie: e.target.value as ActeurLocalCategory }))}
              options={Object.values(ActeurLocalCategory).map((cat) => ({
                value: cat,
                label: t(`acteurs.categories.${cat}`),
              }))}
            />
            <Select
              label={t('adminSpace.fields.subcategory')}
              value={form.subcategory}
              onChange={(e) => setForm((f) => ({ ...f, subcategory: e.target.value as ChartronsSubcategory }))}
              options={CHARTRONS_SUBCATEGORIES.map((subcategory) => ({
                value: subcategory,
                label: loc(i18n.language, CHARTRONS_SUBCATEGORY_LABELS[subcategory]),
              }))}
            />
          </div>
          <Select
            label={t('adminSpace.fields.tier')}
            value={form.tier}
            onChange={(e) => setForm((f) => ({ ...f, tier: e.target.value as MerchantTier }))}
            options={[
              { value: 'free', label: t('adminSpace.tier.free') },
              { value: 'premium_pro', label: t('adminSpace.tier.premium_pro') },
            ]}
          />
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label={t('acteurs.vip')}
              value={form.offreVip}
              onChange={(e) => setForm((f) => ({ ...f, offreVip: e.target.value }))}
              placeholder={t('adminSpace.fields.vipPlaceholder')}
            />
            <Input
              label={t('adminSpace.fields.vipPoints')}
              type="number"
              min="0"
              value={form.pointsRequisVip}
              onChange={(e) => setForm((f) => ({ ...f, pointsRequisVip: e.target.value }))}
            />
          </div>
          <AdminPhotoField
            label={t('posts.create.photo')}
            value={form.photo}
            onChange={(photo) => setForm((f) => ({ ...f, photo }))}
          />
          <div className="space-y-2">
            <p className="text-xs font-semibold text-chartrons-olive-dark uppercase tracking-wide">
              {t('access.title')}
            </p>
            {(
              [
                ['hasDelivery', 'access.delivery'] as const,
                ['wheelchairAccessible', 'access.wheelchair'] as const,
                ['seniorFriendly', 'access.senior'] as const,
              ]
            ).map(([field, labelKey]) => (
              <label key={field} className="flex items-center gap-3 p-3 rounded-xl bg-chartrons-beige/50 cursor-pointer">
                <input
                  type="checkbox"
                  checked={form[field]}
                  onChange={(e) => setForm((current) => ({ ...current, [field]: e.target.checked }))}
                  className="w-4 h-4 accent-chartrons-bordeaux"
                />
                <span className="text-sm font-medium text-chartrons-olive-dark">{t(labelKey)}</span>
              </label>
            ))}
          </div>
          <label className="flex items-start gap-3 p-3 rounded-xl bg-chartrons-beige/50 cursor-pointer">
            <input
              type="checkbox"
              checked={form.activerFidelite}
              disabled={Boolean(editing?.qrCodeVitrine)}
              onChange={(e) => setForm((f) => ({ ...f, activerFidelite: e.target.checked }))}
              className="mt-1 w-4 h-4 accent-chartrons-bordeaux"
            />
            <span>
              <span className="block text-sm font-medium text-chartrons-olive-dark">
                {t('acteurs.create.activateFidelite')}
              </span>
              <span className="block text-xs text-chartrons-warm-gray mt-0.5">
                {editing?.qrCodeVitrine
                  ? t('acteurs.qrActiveHint')
                  : t('acteurs.create.activateFideliteHint')}
              </span>
            </span>
          </label>
          <div className="flex flex-col-reverse sm:flex-row gap-2 pt-2">
            <Button type="button" variant="secondary" className="flex-1" onClick={closeModal}>
              {t('common.cancel')}
            </Button>
            <Button type="submit" variant="bordeaux" className="flex-1" disabled={saving}>
              {saving ? t('common.loading') : t('common.save')}
            </Button>
          </div>
        </form>
      </Modal>

      <Modal
        open={Boolean(posterActeur)}
        onClose={() => setPosterActeur(null)}
        title={t('poster.open')}
        size="lg"
      >
        {posterActeur && <StorefrontPoster acteur={posterActeur} />}
      </Modal>
    </div>
  );
}
