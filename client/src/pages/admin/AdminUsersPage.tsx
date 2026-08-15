import { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { PreferredLanguage, UserRole, type User } from '@idea-chartrons/shared';
import { AdminDataTable } from '../../components/admin/AdminDataTable';
import { AdminPageHeader } from '../../components/admin/AdminPageHeader';
import { Badge, Button, Card, EmptyState, Input, Loading, Modal, Select } from '../../components/ui';
import { useToast } from '../../context/ToastContext';
import { api } from '../../lib/api';

interface UserForm {
  nom: string;
  email: string;
  role: UserRole;
  badgeVerifie: boolean;
  adresse: string;
  languePreferee: PreferredLanguage;
  pointsFidelite: string;
}

const emptyForm = (): UserForm => ({
  nom: '',
  email: '',
  role: UserRole.Habitant,
  badgeVerifie: false,
  adresse: '',
  languePreferee: PreferredLanguage.FR,
  pointsFidelite: '0',
});

export function AdminUsersPage() {
  const { t } = useTranslation();
  const { showToast } = useToast();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState('');
  const [editing, setEditing] = useState<User | null>(null);
  const [creating, setCreating] = useState(false);
  const [form, setForm] = useState<UserForm>(emptyForm());
  const [saving, setSaving] = useState(false);

  const load = () => {
    setLoading(true);
    api
      .getUsers()
      .then(setUsers)
      .catch(console.error)
      .finally(() => setLoading(false));
  };

  useEffect(load, []);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return users.filter(
      (u) =>
        !q ||
        u.nom.toLowerCase().includes(q) ||
        u.email.toLowerCase().includes(q) ||
        u.adresse.toLowerCase().includes(q),
    );
  }, [users, query]);

  const openCreate = () => {
    setEditing(null);
    setForm(emptyForm());
    setCreating(true);
  };

  const openEdit = (user: User) => {
    setCreating(false);
    setEditing(user);
    setForm({
      nom: user.nom,
      email: user.email,
      role: user.role,
      badgeVerifie: user.badgeVerifie,
      adresse: user.adresse,
      languePreferee: user.languePreferee,
      pointsFidelite: String(user.pointsFidelite),
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
        nom: form.nom,
        email: form.email,
        role: form.role,
        badgeVerifie: form.badgeVerifie,
        adresse: form.adresse,
        languePreferee: form.languePreferee,
        pointsFidelite: Number(form.pointsFidelite) || 0,
      };
      if (editing) {
        await api.updateUser(editing.id, payload);
      } else {
        await api.createUser(payload);
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

  if (loading) return <Loading message={t('common.loading')} />;

  const actions = (user: User) => (
    <Button type="button" variant="secondary" size="sm" onClick={() => openEdit(user)}>
      {t('common.edit')}
    </Button>
  );

  return (
    <div className="animate-fade-in">
      <AdminPageHeader
        title={t('adminSpace.nav.users')}
        subtitle={t('adminSpace.pages.usersSub')}
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
        empty={<EmptyState icon="👥" message={t('adminSpace.dashboard.empty')} />}
        columns={[
          {
            header: t('adminSpace.fields.name'),
            render: (user) => (
              <div>
                <p className="font-medium text-chartrons-olive-dark">{user.nom}</p>
                <p className="text-xs text-chartrons-warm-gray">{user.email}</p>
              </div>
            ),
          },
          {
            header: t('adminSpace.fields.role'),
            render: (user) => <Badge>{t(`profile.roles.${user.role}`)}</Badge>,
          },
          {
            header: t('profile.points'),
            render: (user) => <span className="font-semibold text-chartrons-brass">{user.pointsFidelite}</span>,
          },
          {
            header: t('profile.verified'),
            render: (user) => (
              <Badge variant={user.badgeVerifie ? 'olive' : 'stone'}>
                {user.badgeVerifie ? t('profile.verified') : t('profile.notVerified')}
              </Badge>
            ),
          },
          { header: t('adminSpace.fields.actions'), render: actions },
        ]}
        mobileCard={(user) => (
          <Card key={user.id} className="!p-4">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="font-semibold text-chartrons-olive-dark">{user.nom}</p>
                <p className="text-xs text-chartrons-warm-gray">{user.email}</p>
                <p className="text-xs text-chartrons-warm-gray mt-1">{user.adresse}</p>
                <div className="flex flex-wrap gap-1.5 mt-2">
                  <Badge>{t(`profile.roles.${user.role}`)}</Badge>
                  <Badge variant="brass">{user.pointsFidelite} pts</Badge>
                  <Badge variant={user.badgeVerifie ? 'olive' : 'stone'}>
                    {user.badgeVerifie ? t('profile.verified') : t('profile.notVerified')}
                  </Badge>
                </div>
              </div>
            </div>
            <div className="mt-3">{actions(user)}</div>
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
            label={t('adminSpace.fields.name')}
            value={form.nom}
            onChange={(e) => setForm((f) => ({ ...f, nom: e.target.value }))}
            required
          />
          <Input
            label="Email"
            type="email"
            value={form.email}
            onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
            required
          />
          <Input
            label={t('adminSpace.fields.address')}
            value={form.adresse}
            onChange={(e) => setForm((f) => ({ ...f, adresse: e.target.value }))}
            required
          />
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Select
              label={t('adminSpace.fields.role')}
              value={form.role}
              onChange={(e) => setForm((f) => ({ ...f, role: e.target.value as UserRole }))}
              options={Object.values(UserRole).map((role) => ({
                value: role,
                label: t(`profile.roles.${role}`),
              }))}
            />
            <Select
              label={t('common.language')}
              value={form.languePreferee}
              onChange={(e) => setForm((f) => ({ ...f, languePreferee: e.target.value as PreferredLanguage }))}
              options={[
                { value: PreferredLanguage.FR, label: 'FR' },
                { value: PreferredLanguage.EN, label: 'EN' },
              ]}
            />
          </div>
          <Input
            label={t('profile.points')}
            type="number"
            min="0"
            value={form.pointsFidelite}
            onChange={(e) => setForm((f) => ({ ...f, pointsFidelite: e.target.value }))}
          />
          <label className="flex items-center gap-3 min-h-[44px] cursor-pointer">
            <input
              type="checkbox"
              checked={form.badgeVerifie}
              onChange={(e) => setForm((f) => ({ ...f, badgeVerifie: e.target.checked }))}
              className="w-5 h-5 rounded border-chartrons-beige accent-chartrons-bordeaux"
            />
            <span className="text-sm font-medium text-chartrons-olive-dark">{t('profile.verified')}</span>
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
