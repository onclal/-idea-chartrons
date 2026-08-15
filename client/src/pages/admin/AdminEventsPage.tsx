import { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { EventType, type AgendaEvenement, type User } from '@idea-chartrons/shared';
import { AdminDataTable } from '../../components/admin/AdminDataTable';
import { AdminPageHeader } from '../../components/admin/AdminPageHeader';
import { AdminPhotoField } from '../../components/admin/AdminPhotoField';
import { Badge, Button, Card, EmptyState, Input, Loading, Modal, Select, Textarea } from '../../components/ui';
import { useToast } from '../../context/ToastContext';
import { api } from '../../lib/api';
import { formatDateTime, toDatetimeLocal } from '../../lib/format';

interface EventForm {
  titre: string;
  description: string;
  dateDebut: string;
  dateFin: string;
  image: string;
  type: EventType;
  organisateurId: string;
}

const emptyForm = (organisateurId: string): EventForm => {
  const start = new Date();
  start.setMinutes(0, 0, 0);
  const end = new Date(start.getTime() + 2 * 60 * 60 * 1000);
  return {
    titre: '',
    description: '',
    dateDebut: toDatetimeLocal(start.toISOString()),
    dateFin: toDatetimeLocal(end.toISOString()),
    image: '',
    type: EventType.AnimationAsso,
    organisateurId,
  };
};

export function AdminEventsPage() {
  const { t, i18n } = useTranslation();
  const { showToast } = useToast();
  const [events, setEvents] = useState<AgendaEvenement[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState('');
  const [editing, setEditing] = useState<AgendaEvenement | null>(null);
  const [creating, setCreating] = useState(false);
  const [form, setForm] = useState<EventForm>(emptyForm(''));
  const [saving, setSaving] = useState(false);

  const load = () => {
    setLoading(true);
    Promise.all([api.getEvents(), api.getUsers()])
      .then(([eventsData, usersData]) => {
        setEvents(eventsData);
        setUsers(usersData);
        setForm((prev) => ({ ...prev, organisateurId: prev.organisateurId || usersData[0]?.id || '' }));
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  };

  useEffect(load, []);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return [...events]
      .filter((e) => !q || e.titre.toLowerCase().includes(q) || e.description.toLowerCase().includes(q))
      .sort((a, b) => new Date(a.dateDebut).getTime() - new Date(b.dateDebut).getTime());
  }, [events, query]);

  const openCreate = () => {
    setEditing(null);
    setForm(emptyForm(users[0]?.id ?? ''));
    setCreating(true);
  };

  const openEdit = (event: AgendaEvenement) => {
    setCreating(false);
    setEditing(event);
    setForm({
      titre: event.titre,
      description: event.description,
      dateDebut: toDatetimeLocal(event.dateDebut),
      dateFin: toDatetimeLocal(event.dateFin),
      image: event.image ?? '',
      type: event.type,
      organisateurId: event.organisateurId,
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
        organisateurId: form.organisateurId,
        titre: form.titre,
        description: form.description,
        dateDebut: new Date(form.dateDebut).toISOString(),
        dateFin: new Date(form.dateFin).toISOString(),
        image: form.image || null,
        type: form.type,
      };
      if (editing) {
        await api.updateEvent(editing.id, payload);
      } else {
        await api.createEvent(payload);
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

  const handleDelete = async (event: AgendaEvenement) => {
    if (!window.confirm(t('admin.deleteEventConfirm', { title: event.titre }))) return;
    await api.deleteEvent(event.id);
    load();
    showToast(t('admin.deleteSuccess'));
  };

  if (loading) return <Loading message={t('common.loading')} />;

  const actions = (event: AgendaEvenement) => (
    <div className="flex gap-2">
      <Button type="button" variant="secondary" size="sm" onClick={() => openEdit(event)}>
        {t('common.edit')}
      </Button>
      <Button
        type="button"
        variant="secondary"
        size="sm"
        className="border-chartrons-brick/30 text-chartrons-brick"
        onClick={() => handleDelete(event)}
      >
        {t('common.delete')}
      </Button>
    </div>
  );

  return (
    <div className="animate-fade-in">
      <AdminPageHeader
        title={t('adminSpace.nav.events')}
        subtitle={t('adminSpace.pages.eventsSub')}
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
            icon="📅"
            title={t('events.emptyTitle')}
            message={t('adminSpace.dashboard.empty')}
            action={{ label: `+ ${t('adminSpace.actions.create')}`, onClick: openCreate }}
          />
        }
        columns={[
          {
            header: t('posts.create.titre'),
            render: (event) => (
              <div className="flex items-center gap-3 min-w-0">
                {event.image && (
                  <img src={event.image} alt="" className="w-12 h-12 rounded-xl object-cover shrink-0" />
                )}
                <p className="font-medium text-chartrons-olive-dark truncate max-w-xs">{event.titre}</p>
              </div>
            ),
          },
          {
            header: t('adminSpace.fields.type'),
            render: (event) => <Badge variant="brick">{t(`events.types.${event.type}`)}</Badge>,
          },
          {
            header: t('adminSpace.fields.date'),
            render: (event) => (
              <span className="text-chartrons-warm-gray whitespace-nowrap">
                {formatDateTime(event.dateDebut, i18n.language)}
              </span>
            ),
          },
          { header: t('adminSpace.fields.actions'), render: actions },
        ]}
        mobileCard={(event) => (
          <Card key={event.id} className="!p-4">
            <div className="flex gap-3">
              {event.image && (
                <img src={event.image} alt="" className="w-16 h-16 rounded-xl object-cover shrink-0" />
              )}
              <div className="min-w-0 flex-1">
                <p className="font-semibold text-chartrons-olive-dark">{event.titre}</p>
                <p className="text-xs text-chartrons-warm-gray mt-0.5">
                  {formatDateTime(event.dateDebut, i18n.language)}
                </p>
                <Badge variant="brick" className="mt-2">
                  {t(`events.types.${event.type}`)}
                </Badge>
              </div>
            </div>
            <div className="mt-3">{actions(event)}</div>
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
            label={t('posts.create.titre')}
            value={form.titre}
            onChange={(e) => setForm((f) => ({ ...f, titre: e.target.value }))}
            required
          />
          <Textarea
            label={t('posts.create.description')}
            value={form.description}
            onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
            required
            rows={3}
          />
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Select
              label={t('adminSpace.fields.type')}
              value={form.type}
              onChange={(e) => setForm((f) => ({ ...f, type: e.target.value as EventType }))}
              options={Object.values(EventType).map((type) => ({
                value: type,
                label: t(`events.types.${type}`),
              }))}
            />
            <Select
              label={t('adminSpace.fields.organizer')}
              value={form.organisateurId}
              onChange={(e) => setForm((f) => ({ ...f, organisateurId: e.target.value }))}
              options={users.map((u) => ({ value: u.id, label: u.nom }))}
            />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label={t('adminSpace.fields.start')}
              type="datetime-local"
              value={form.dateDebut}
              onChange={(e) => setForm((f) => ({ ...f, dateDebut: e.target.value }))}
              required
            />
            <Input
              label={t('adminSpace.fields.end')}
              type="datetime-local"
              value={form.dateFin}
              onChange={(e) => setForm((f) => ({ ...f, dateFin: e.target.value }))}
              required
            />
          </div>
          <AdminPhotoField
            label={t('posts.create.photo')}
            value={form.image}
            onChange={(image) => setForm((f) => ({ ...f, image }))}
          />
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
