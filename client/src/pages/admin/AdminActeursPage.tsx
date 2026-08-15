import { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ActeurLocalCategory, type ActeurLocal, type User } from '@idea-chartrons/shared';
import { AdminDataTable } from '../../components/admin/AdminDataTable';
import { AdminPageHeader } from '../../components/admin/AdminPageHeader';
import { AdminPhotoField } from '../../components/admin/AdminPhotoField';
import { Badge, Button, Card, EmptyState, Input, Loading, Modal, Select, Textarea } from '../../components/ui';
import { useToast } from '../../context/ToastContext';
import { api } from '../../lib/api';

interface ActeurForm {
  nomCommerce: string;
  categorie: ActeurLocalCategory;
  description: string;
  adresse: string;
  photo: string;
  offreVip: string;
  pointsRequisVip: string;
  userId: string;
  activerFidelite: boolean;
}

const emptyForm = (userId: string): ActeurForm => ({
  nomCommerce: '',
  categorie: ActeurLocalCategory.Commercant,
  description: '',
  adresse: '',
  photo: '',
  offreVip: '',
  pointsRequisVip: '50',
  userId,
  activerFidelite: false,
});

export function AdminActeursPage() {
  const { t } = useTranslation();
  const { showToast } = useToast();
  const [acteurs, setActeurs] = useState<ActeurLocal[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState('');
  const [editing, setEditing] = useState<ActeurLocal | null>(null);
  const [creating, setCreating] = useState(false);
  const [form, setForm] = useState<ActeurForm>(emptyForm(''));
  const [saving, setSaving] = useState(false);

  const load = () => {
    setLoading(true);
    Promise.all([api.getActeurs(), api.getUsers()])
      .then(([acteursData, usersData]) => {
        setActeurs(acteursData);
        setUsers(usersData);
        setForm((prev) => ({ ...prev, userId: prev.userId || usersData[0]?.id || '' }));
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  };

  useEffect(load, []);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return acteurs.filter(
      (a) =>
        !q ||
        a.nomCommerce.toLowerCase().includes(q) ||
        a.description.toLowerCase().includes(q) ||
        a.adresse.toLowerCase().includes(q),
    );
  }, [acteurs, query]);

  const openCreate = () => {
    setEditing(null);
    setForm(emptyForm(users[0]?.id ?? ''));
    setCreating(true);
  };

  const openEdit = (acteur: ActeurLocal) => {
    setCreating(false);
    setEditing(acteur);
    setForm({
      nomCommerce: acteur.nomCommerce,
      categorie: acteur.categorie,
      description: acteur.description,
      adresse: acteur.adresse,
      photo: acteur.photos[0] ?? '',
      offreVip: acteur.offreVip ?? '',
      pointsRequisVip: String(acteur.pointsRequisVip),
      userId: acteur.userId,
      activerFidelite: Boolean(acteur.qrCodeVitrine),
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
        userId: form.userId,
        nomCommerce: form.nomCommerce,
        categorie: form.categorie,
        description: form.description,
        adresse: form.adresse,
        photos: form.photo ? [form.photo] : [],
        offreVip: form.offreVip.trim() || null,
        pointsRequisVip: Number(form.pointsRequisVip) || 0,
      };
      if (editing) {
        await api.updateActeur(editing.id, payload);
        if (form.activerFidelite && !editing.qrCodeVitrine) {
          await api.generateQrVitrine(editing.id);
        }
      } else {
        await api.createActeur({ ...payload, activerFidelite: form.activerFidelite });
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

  const handleDelete = async (acteur: ActeurLocal) => {
    if (!window.confirm(t('admin.deleteActeurConfirm', { name: acteur.nomCommerce }))) return;
    await api.deleteActeur(acteur.id);
    load();
    showToast(t('admin.deleteSuccess'));
  };

  if (loading) return <Loading message={t('common.loading')} />;

  const actions = (acteur: ActeurLocal) => (
    <div className="flex gap-2">
      <Button type="button" variant="secondary" size="sm" onClick={() => openEdit(acteur)}>
        {t('common.edit')}
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
        title={t('adminSpace.nav.acteurs')}
        subtitle={t('adminSpace.pages.acteursSub')}
        action={
          <Button variant="bordeaux" onClick={openCreate} className="w-full sm:w-auto">
            + {t('adminSpace.actions.create')}
          </Button>
        }
      />

      <div className="mb-4">
        <Input value={query} onChange={(e) => setQuery(e.target.value)} placeholder={t('common.search')} />
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
              <Badge variant="olive">{t(`acteurs.categories.${acteur.categorie}`)}</Badge>
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
              label={t('adminSpace.fields.owner')}
              value={form.userId}
              onChange={(e) => setForm((f) => ({ ...f, userId: e.target.value }))}
              options={users.map((u) => ({ value: u.id, label: u.nom }))}
            />
          </div>
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
    </div>
  );
}
