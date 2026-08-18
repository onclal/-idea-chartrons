import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { LocalRelaisRetraitStatus, PostStatus, PostType, isResidentFeedPost, type LocalRelais, type PostAnnonce } from '@idea-chartrons/shared';
import { Badge, Button, Card, EmptyState, Loading } from '../components/ui';
import { PageHelp } from '../components/PageHelp';
import { PhoneLink } from '../components/PhoneLink';
import { ContactForm } from '../components/ContactForm';
import { AdminDeleteButton } from '../components/AdminDeleteButton';
import { OwnerPostActions } from '../components/OwnerPostActions';
import { PostCreateForm } from '../components/PostCreateForm';
import { DepotSlotModal } from '../components/RelaisSlotPicker';
import { CheckoutModal } from '../components/CheckoutModal';
import { useToast } from '../context/ToastContext';
import { matchesSearch, useSearch } from '../context/SearchContext';
import { api } from '../lib/api';
import { bookingErrorMessage } from '../lib/bookingErrors';
import { ownsPost } from '../lib/guestCarnet';

const FILTER_TYPES = [
  'all',
  PostType.Don,
  PostType.Vente,
  PostType.ServiceAide,
  PostType.PetitBoulot,
] as const;

type FilterType = (typeof FILTER_TYPES)[number];

export function PostsPage() {
  const { t } = useTranslation();
  const { query } = useSearch();
  const { showToast } = useToast();
  const [posts, setPosts] = useState<PostAnnonce[]>([]);
  const [relaisMap, setRelaisMap] = useState<Map<string, LocalRelais>>(new Map());
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<FilterType>('all');
  const [showCreate, setShowCreate] = useState(false);
  const [editingPost, setEditingPost] = useState<PostAnnonce | null>(null);
  const [depotPostId, setDepotPostId] = useState<string | null>(null);
  const [depotLoading, setDepotLoading] = useState(false);
  const [checkoutPost, setCheckoutPost] = useState<PostAnnonce | null>(null);
  const [contactContext, setContactContext] = useState<string | null>(null);

  const loadPosts = (opts?: { silent?: boolean }) => {
    if (!opts?.silent) setLoading(true);
    Promise.all([api.getPosts(), api.getRelais()])
      .then(([postsData, relais]) => {
        setPosts(postsData);
        setRelaisMap(new Map(relais.map((r) => [r.postId, r])));
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  };

  useEffect(loadPosts, []);

  const filteredPosts = useMemo(() => {
    const filtered = posts
      .filter((post) => {
        if (!isResidentFeedPost(post)) return false;
        if (post.statut === PostStatus.EnAttente && !ownsPost(post.id)) return false;
        const matchesFilter = filter === 'all' || post.type === filter;
        const matchesQuery =
          matchesSearch(post.titre, query) || matchesSearch(post.description, query);
        return matchesFilter && matchesQuery;
      })
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    return filtered;
  }, [posts, filter, query]);

  const sponsoredPostId = null;

  const handleDepotConfirm = async (creneauId: string) => {
    if (!depotPostId) return;
    setDepotLoading(true);
    try {
      await api.proposeDepotLocal({
        postId: depotPostId,
        deposantNom: posts.find((post) => post.id === depotPostId)?.auteurNom ?? null,
        creneauDepotId: creneauId,
      });
      setDepotPostId(null);
      loadPosts({ silent: true });
      showToast(t('toast.depotReserved'));
    } catch (err) {
      showToast(bookingErrorMessage(err, t), 'error');
    } finally {
      setDepotLoading(false);
    }
  };

  const openCreate = () => {
    setEditingPost(null);
    setShowCreate(true);
  };

  const openEdit = (post: PostAnnonce) => {
    setEditingPost(post);
    setShowCreate(true);
  };

  const closeForm = () => {
    setShowCreate(false);
    setEditingPost(null);
  };

  const handleDeletePost = async (postId: string) => {
    await api.deletePost(postId);
    loadPosts({ silent: true });
    showToast(t('admin.deleteSuccess'));
  };

  if (loading) return <Loading message={t('common.loading')} />;

  return (
    <div className="space-y-4 animate-fade-in">
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-start gap-2 min-w-0">
          <div className="min-w-0">
            <h2 className="text-xl font-bold text-chartrons-bordeaux">{t('posts.title')}</h2>
            {query && (
              <p className="text-xs text-chartrons-warm-gray mt-0.5">
                {t('search.results', { count: filteredPosts.length, query })}
              </p>
            )}
          </div>
          <PageHelp page="posts" />
        </div>
        <Button size="sm" variant="bordeaux" onClick={openCreate}>
          + {t('posts.create.button')}
        </Button>
      </div>

      <Link
        to="/anti-gaspi"
        className="flex items-center gap-3 rounded-2xl border border-chartrons-green/25 bg-gradient-to-r from-chartrons-green/10 to-chartrons-beige/60 p-3 shadow-card"
      >
        <span className="text-2xl" aria-hidden>♻️</span>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold text-chartrons-green">{t('antigaspi.title')}</p>
          <p className="text-xs text-chartrons-warm-gray leading-relaxed">{t('posts.antiGaspiHint')}</p>
        </div>
        <span className="text-chartrons-green font-bold">→</span>
      </Link>

      <div className="flex gap-2 overflow-x-auto pb-1 -mx-1 px-1">
        {FILTER_TYPES.map((ft) => (
          <button
            key={ft}
            onClick={() => setFilter(ft)}
            className={`shrink-0 touch-target px-4 py-2 rounded-full text-xs font-semibold border transition-all ${
              filter === ft
                ? 'bg-chartrons-bordeaux text-white border-chartrons-bordeaux shadow-sm'
                : 'bg-white text-chartrons-olive-dark border-chartrons-beige hover:border-chartrons-bordeaux/30'
            }`}
          >
            {ft === 'all' ? t('posts.filters.all') : t(`posts.types.${ft}`)}
          </button>
        ))}
      </div>

      {filteredPosts.length === 0 ? (
        <EmptyState
          icon={query ? '🔍' : '📋'}
          title={query ? t('search.noResultsTitle') : t('posts.emptyTitle')}
          message={query ? t('search.noResultsHint') : t('posts.emptyHint')}
          action={
            !query
              ? { label: `+ ${t('posts.create.button')}`, onClick: openCreate }
              : undefined
          }
        />
      ) : (
        <div className="space-y-3">
          {filteredPosts.map((post) => {
            const relais = relaisMap.get(post.id);
            // Le droit d'édition vient du registre local, pas d'un compte.
            const isOwner = ownsPost(post.id);
            const isReadyLocal =
              relais?.statutRetrait === LocalRelaisRetraitStatus.DisponibleAuLocal;
            const isSponsored = post.id === sponsoredPostId;

            return (
              <Card
                key={post.id}
                className={`!p-0 overflow-hidden ${
                  isSponsored ? 'ring-2 ring-chartrons-brass/45 border-chartrons-brass/30' : ''
                }`}
              >
                {post.photos[0] && (
                  <div className="relative">
                    <img
                      src={post.photos[0]}
                      alt=""
                      className={`w-full object-cover ${isSponsored ? 'h-48' : 'h-40'}`}
                    />
                    {(isSponsored || isReadyLocal) && (
                      <div className="absolute top-3 left-3 flex flex-wrap gap-1.5">
                        {isSponsored && (
                          <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold uppercase tracking-[0.08em] bg-chartrons-bordeaux text-white ring-2 ring-chartrons-brass shadow-md">
                            <span aria-hidden>✨</span>
                            {t('posts.sponsored')}
                          </span>
                        )}
                        {isReadyLocal && (
                          <Badge variant="local" icon="📦">{t('badges.local')}</Badge>
                        )}
                      </div>
                    )}
                  </div>
                )}
                <div className="p-4">
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <h3 className="font-semibold text-chartrons-olive-dark text-base leading-snug">
                      {post.titre}
                    </h3>
                    <Badge
                      variant={
                        post.statut === 'Disponible'
                          ? 'olive'
                          : post.statut === PostStatus.EnAttente
                            ? 'gold'
                            : 'stone'
                      }
                    >
                      {t(`posts.status.${post.statut}`)}
                    </Badge>
                  </div>
                  {!post.photos[0] && (isSponsored || isReadyLocal) && (
                    <div className="flex flex-wrap gap-1.5 mb-2">
                      {isSponsored && (
                        <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold uppercase tracking-[0.08em] bg-chartrons-bordeaux text-white ring-2 ring-chartrons-brass shadow-md">
                          <span aria-hidden>✨</span>
                          {t('posts.sponsored')}
                        </span>
                      )}
                      {isReadyLocal && (
                        <Badge variant="local" icon="📦">
                          {t('badges.local')}
                        </Badge>
                      )}
                    </div>
                  )}
                  <p className="text-sm text-chartrons-warm-gray mb-3 line-clamp-2 leading-relaxed">
                    {post.description}
                  </p>
                  <div className="mb-3">
                    <PhoneLink phone={post.telephone} />
                  </div>
                  <div className="flex items-center justify-between mb-3">
                    <Badge variant="brick">{t(`posts.types.${post.type}`)}</Badge>
                    <span className="text-base font-bold text-chartrons-bordeaux">
                      {isSponsored && post.prix !== null
                        ? t('posts.fromPrice', { price: post.prix })
                        : post.prix !== null
                          ? `${post.prix} €`
                          : t('posts.free')}
                    </span>
                  </div>
                  <div className="space-y-2">
                    {!isOwner &&
                      post.type === PostType.Vente &&
                      post.prix !== null &&
                      post.statut !== 'Clôturé' &&
                      post.statut !== PostStatus.EnAttente && (
                        <Button
                          variant="bordeaux"
                          size="md"
                          className="w-full"
                          onClick={() => setCheckoutPost(post)}
                        >
                          🔒 {t('posts.buyOnline')}
                        </Button>
                      )}
                    {post.statut !== 'Dépôt_Local' &&
                      post.statut !== 'Clôturé' &&
                      post.statut !== PostStatus.EnAttente && (
                      <Button
                        variant="secondary"
                        size="md"
                        className="w-full"
                        onClick={() => setDepotPostId(post.id)}
                      >
                        📦 {t('posts.depotLocal')}
                      </Button>
                    )}
                    {isOwner ? (
                      <div className="space-y-2">
                        <p className="text-xs font-medium text-chartrons-olive">{t('posts.mine')}</p>
                        <OwnerPostActions
                          post={post}
                          onEdit={() => openEdit(post)}
                          onDeleted={() => loadPosts({ silent: true })}
                        />
                      </div>
                    ) : (
                      <Button
                        variant="ghost"
                        size="md"
                        className="w-full border border-chartrons-beige"
                        onClick={() => setContactContext(t('contact.postContext', { title: post.titre }))}
                      >
                        {t('contact.askQuestion')}
                      </Button>
                    )}
                  </div>
                  {!isOwner && (
                    <AdminDeleteButton
                      label={t('admin.deletePost')}
                      confirmMessage={t('admin.deletePostConfirm', { title: post.titre })}
                      onDelete={() => handleDeletePost(post.id)}
                      className="mt-2"
                    />
                  )}
                </div>
              </Card>
            );
          })}
        </div>
      )}

      <PostCreateForm
        open={showCreate}
        onClose={closeForm}
        onCreated={() => loadPosts({ silent: true })}
        post={editingPost}
      />

      <DepotSlotModal
        open={!!depotPostId}
        onClose={() => setDepotPostId(null)}
        onConfirm={handleDepotConfirm}
        loading={depotLoading}
        prix={posts.find((post) => post.id === depotPostId)?.prix ?? null}
      />

      <CheckoutModal
        open={!!checkoutPost}
        item={
          checkoutPost
            ? {
                id: checkoutPost.id,
                title: checkoutPost.titre,
                imageUrl: checkoutPost.photos[0] ?? null,
                price: checkoutPost.prix ?? 0,
                sellerName: checkoutPost.auteurNom ?? undefined,
                kind: 'post',
              }
            : null
        }
        onClose={() => setCheckoutPost(null)}
        onConfirm={(_item, _total, orderId) => {
          showToast(t('toast.purchaseConfirmed', { orderId }));
        }}
      />

      <ContactForm
        open={!!contactContext}
        onClose={() => setContactContext(null)}
        context={contactContext ?? undefined}
      />
    </div>
  );
}
