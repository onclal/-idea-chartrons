import { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { PostStatus, PostType, type PostAnnonce, type User } from '@idea-chartrons/shared';
import { AdminDataTable } from '../../components/admin/AdminDataTable';
import { AdminPageHeader } from '../../components/admin/AdminPageHeader';
import { AdminPhotoField } from '../../components/admin/AdminPhotoField';
import { Badge, Button, Card, EmptyState, Input, Loading, Modal, Select, Textarea } from '../../components/ui';
import { useToast } from '../../context/ToastContext';
import { api } from '../../lib/api';
import { formatDateTime } from '../../lib/format';

interface PostForm {
  titre: string;
  description: string;
  type: PostType;
  prix: string;
  statut: PostStatus;
  photo: string;
  auteurId: string;
  telephone: string;
}

const emptyForm = (auteurId: string): PostForm => ({
  titre: '',
  description: '',
  type: PostType.Don,
  prix: '',
  statut: PostStatus.Disponible,
  photo: '',
  auteurId,
  telephone: '',
});

export function AdminPostsPage() {
  const { t, i18n } = useTranslation();
  const { showToast } = useToast();
  const [posts, setPosts] = useState<PostAnnonce[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState('');
  const [editing, setEditing] = useState<PostAnnonce | null>(null);
  const [creating, setCreating] = useState(false);
  const [form, setForm] = useState<PostForm>(emptyForm(''));
  const [saving, setSaving] = useState(false);

  const load = () => {
    setLoading(true);
    Promise.all([api.getPosts(), api.getUsers()])
      .then(([postsData, usersData]) => {
        setPosts(postsData);
        setUsers(usersData);
        setForm((prev) => ({ ...prev, auteurId: prev.auteurId || usersData[0]?.id || '' }));
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  };

  useEffect(load, []);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return [...posts]
      .filter((p) => !q || p.titre.toLowerCase().includes(q) || p.description.toLowerCase().includes(q))
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }, [posts, query]);

  const userName = (id: string) => users.find((u) => u.id === id)?.nom ?? id;

  const openCreate = () => {
    setEditing(null);
    setForm(emptyForm(users[0]?.id ?? ''));
    setCreating(true);
  };

  const openEdit = (post: PostAnnonce) => {
    setCreating(false);
    setEditing(post);
    setForm({
      titre: post.titre,
      description: post.description,
      type: post.type,
      prix: post.prix != null ? String(post.prix) : '',
      statut: post.statut,
      photo: post.photos[0] ?? '',
      auteurId: post.auteurId,
      telephone: post.telephone ?? '',
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
        titre: form.titre,
        description: form.description,
        type: form.type,
        prix:
          form.type === PostType.Vente || form.type === PostType.PetitBoulot
            ? Number(form.prix) || 0
            : null,
        photos: form.photo ? [form.photo] : [],
        auteurId: form.auteurId,
        statut: form.statut,
        telephone: form.telephone.trim() || null,
      };
      if (editing) {
        await api.updatePost(editing.id, payload);
        showToast(t('adminSpace.saved'));
      } else {
        await api.createPost(payload);
        showToast(t('toast.postPublished'));
      }
      closeModal();
      load();
    } catch (err) {
      showToast(err instanceof Error ? err.message : t('common.error'), 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (post: PostAnnonce) => {
    if (!window.confirm(t('admin.deletePostConfirm', { title: post.titre }))) return;
    await api.deletePost(post.id);
    load();
    showToast(t('admin.deleteSuccess'));
  };

  if (loading) return <Loading message={t('common.loading')} />;

  const formOpen = creating || !!editing;

  const actions = (post: PostAnnonce) => (
    <div className="flex gap-2">
      <Button type="button" variant="secondary" size="sm" onClick={() => openEdit(post)}>
        {t('common.edit')}
      </Button>
      <Button
        type="button"
        variant="secondary"
        size="sm"
        className="border-chartrons-brick/30 text-chartrons-brick"
        onClick={() => handleDelete(post)}
      >
        {t('common.delete')}
      </Button>
    </div>
  );

  return (
    <div className="animate-fade-in">
      <AdminPageHeader
        title={t('adminSpace.nav.posts')}
        subtitle={t('adminSpace.pages.postsSub')}
        action={
          <Button variant="bordeaux" onClick={openCreate} className="w-full sm:w-auto">
            + {t('adminSpace.actions.create')}
          </Button>
        }
      />

      <div className="mb-4">
        <Input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={t('common.search')}
        />
      </div>

      <AdminDataTable
        items={filtered}
        empty={
          <EmptyState
            icon="📋"
            title={t('posts.emptyTitle')}
            message={t('adminSpace.dashboard.empty')}
            action={{ label: `+ ${t('adminSpace.actions.create')}`, onClick: openCreate }}
          />
        }
        columns={[
          {
            header: t('posts.create.titre'),
            render: (post) => (
              <div className="flex items-center gap-3 min-w-0">
                {post.photos[0] && (
                  <img src={post.photos[0]} alt="" className="w-12 h-12 rounded-xl object-cover shrink-0" />
                )}
                <div className="min-w-0">
                  <p className="font-medium text-chartrons-olive-dark truncate max-w-xs">{post.titre}</p>
                  <p className="text-xs text-chartrons-warm-gray">{userName(post.auteurId)}</p>
                </div>
              </div>
            ),
          },
          {
            header: t('posts.create.type'),
            render: (post) => <Badge variant="brick">{t(`posts.types.${post.type}`)}</Badge>,
          },
          {
            header: t('adminSpace.fields.status'),
            render: (post) => (
              <Badge variant={post.statut === 'Disponible' ? 'olive' : 'stone'}>
                {t(`posts.status.${post.statut}`)}
              </Badge>
            ),
          },
          {
            header: t('posts.create.prix'),
            render: (post) => (
              <span className="font-semibold text-chartrons-bordeaux">
                {post.prix != null ? `${post.prix} €` : t('posts.free')}
              </span>
            ),
          },
          {
            header: t('adminSpace.fields.date'),
            render: (post) => (
              <span className="text-chartrons-warm-gray whitespace-nowrap">
                {formatDateTime(post.createdAt, i18n.language)}
              </span>
            ),
          },
          { header: t('adminSpace.fields.actions'), render: actions },
        ]}
        mobileCard={(post) => (
          <Card key={post.id} className="!p-4">
            <div className="flex gap-3">
              {post.photos[0] && (
                <img src={post.photos[0]} alt="" className="w-16 h-16 rounded-xl object-cover shrink-0" />
              )}
              <div className="min-w-0 flex-1">
                <p className="font-semibold text-chartrons-olive-dark">{post.titre}</p>
                <p className="text-xs text-chartrons-warm-gray mt-0.5">{userName(post.auteurId)}</p>
                <div className="flex flex-wrap gap-1.5 mt-2">
                  <Badge variant="brick">{t(`posts.types.${post.type}`)}</Badge>
                  <Badge variant={post.statut === 'Disponible' ? 'olive' : 'stone'}>
                    {t(`posts.status.${post.statut}`)}
                  </Badge>
                </div>
              </div>
            </div>
            <div className="mt-3">{actions(post)}</div>
          </Card>
        )}
      />

      <Modal
        open={formOpen}
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
              label={t('posts.create.type')}
              value={form.type}
              onChange={(e) => setForm((f) => ({ ...f, type: e.target.value as PostType }))}
              options={Object.values(PostType).map((type) => ({
                value: type,
                label: t(`posts.types.${type}`),
              }))}
            />
            <Select
              label={t('adminSpace.fields.status')}
              value={form.statut}
              onChange={(e) => setForm((f) => ({ ...f, statut: e.target.value as PostStatus }))}
              options={Object.values(PostStatus).map((status) => ({
                value: status,
                label: t(`posts.status.${status}`),
              }))}
            />
          </div>
          {(form.type === PostType.Vente || form.type === PostType.PetitBoulot) && (
            <Input
              label={t('posts.create.prix')}
              type="number"
              min="0"
              value={form.prix}
              onChange={(e) => setForm((f) => ({ ...f, prix: e.target.value }))}
            />
          )}
          <Select
            label={t('adminSpace.fields.author')}
            value={form.auteurId}
            onChange={(e) => setForm((f) => ({ ...f, auteurId: e.target.value }))}
            options={users.map((u) => ({ value: u.id, label: u.nom }))}
          />
          <Input
            label={t('common.phone')}
            type="tel"
            value={form.telephone}
            onChange={(e) => setForm((f) => ({ ...f, telephone: e.target.value }))}
            placeholder={t('common.phonePlaceholder')}
          />
          <AdminPhotoField
            label={t('posts.create.photo')}
            value={form.photo}
            onChange={(photo) => setForm((f) => ({ ...f, photo }))}
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
