import { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { LocalRelaisRetraitStatus, PostType, type LocalRelais, type PostAnnonce } from '@idea-chartrons/shared';
import { Badge, Button, Card, EmptyState, Loading } from '../components/ui';
import { PostCreateForm } from '../components/PostCreateForm';
import { DepotSlotModal } from '../components/RelaisSlotPicker';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { matchesSearch, useSearch } from '../context/SearchContext';
import { api } from '../lib/api';

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
  const { currentUserId } = useAuth();
  const { showToast } = useToast();
  const [posts, setPosts] = useState<PostAnnonce[]>([]);
  const [relaisMap, setRelaisMap] = useState<Map<string, LocalRelais>>(new Map());
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<FilterType>('all');
  const [showCreate, setShowCreate] = useState(false);
  const [depotPostId, setDepotPostId] = useState<string | null>(null);
  const [depotLoading, setDepotLoading] = useState(false);

  const loadPosts = () => {
    setLoading(true);
    Promise.all([api.getPosts(), api.getRelais()])
      .then(([postsData, relais]) => {
        setPosts(postsData);
        setRelaisMap(new Map(relais.map((r) => [r.postId, r])));
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  };

  useEffect(loadPosts, [currentUserId]);

  const filteredPosts = useMemo(() => {
    return posts
      .filter((post) => {
        const matchesFilter = filter === 'all' || post.type === filter;
        const matchesQuery =
          matchesSearch(post.titre, query) || matchesSearch(post.description, query);
        return matchesFilter && matchesQuery;
      })
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }, [posts, filter, query]);

  const handleDepotConfirm = async (creneauId: string) => {
    if (!depotPostId) return;
    setDepotLoading(true);
    try {
      await api.proposeDepotLocal({
        postId: depotPostId,
        userId: currentUserId,
        creneauDepotId: creneauId,
      });
      setDepotPostId(null);
      loadPosts();
      showToast(t('toast.depotReserved'));
    } catch (err) {
      showToast(err instanceof Error ? err.message : t('common.error'), 'error');
    } finally {
      setDepotLoading(false);
    }
  };

  if (loading) return <Loading message={t('common.loading')} />;

  return (
    <div className="space-y-4 animate-fade-in">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold text-chartrons-bordeaux">{t('posts.title')}</h2>
          {query && (
            <p className="text-xs text-chartrons-warm-gray mt-0.5">
              {t('search.results', { count: filteredPosts.length, query })}
            </p>
          )}
        </div>
        <Button size="sm" variant="bordeaux" onClick={() => setShowCreate(true)}>
          + {t('posts.create.button')}
        </Button>
      </div>

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
              ? { label: `+ ${t('posts.create.button')}`, onClick: () => setShowCreate(true) }
              : undefined
          }
        />
      ) : (
        <div className="space-y-3">
          {filteredPosts.map((post) => {
            const relais = relaisMap.get(post.id);
            const isReadyLocal =
              relais?.statutRetrait === LocalRelaisRetraitStatus.DisponibleAuLocal;

            return (
              <Card key={post.id} className="!p-0 overflow-hidden">
                {post.photos[0] && (
                  <div className="relative">
                    <img src={post.photos[0]} alt="" className="w-full h-40 object-cover" />
                    {isReadyLocal && (
                      <div className="absolute top-3 left-3">
                        <Badge variant="local" icon="📦">{t('badges.local')}</Badge>
                      </div>
                    )}
                  </div>
                )}
                <div className="p-4">
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <h3 className="font-semibold text-chartrons-olive-dark text-base leading-snug">
                      {post.titre}
                    </h3>
                    <Badge variant={post.statut === 'Disponible' ? 'olive' : 'stone'}>
                      {t(`posts.status.${post.statut}`)}
                    </Badge>
                  </div>
                  {!post.photos[0] && isReadyLocal && (
                    <Badge variant="local" icon="📦" className="mb-2">
                      {t('badges.local')}
                    </Badge>
                  )}
                  <p className="text-sm text-chartrons-warm-gray mb-3 line-clamp-2 leading-relaxed">
                    {post.description}
                  </p>
                  <div className="flex items-center justify-between mb-3">
                    <Badge variant="brick">{t(`posts.types.${post.type}`)}</Badge>
                    <span className="text-base font-bold text-chartrons-bordeaux">
                      {post.prix !== null ? `${post.prix} €` : t('posts.free')}
                    </span>
                  </div>
                  {post.statut !== 'Dépôt_Local' && post.statut !== 'Clôturé' && (
                    <Button
                      variant="secondary"
                      size="md"
                      className="w-full"
                      onClick={() => setDepotPostId(post.id)}
                    >
                      📦 {t('posts.depotLocal')}
                    </Button>
                  )}
                </div>
              </Card>
            );
          })}
        </div>
      )}

      <PostCreateForm
        open={showCreate}
        onClose={() => setShowCreate(false)}
        onCreated={loadPosts}
      />

      <DepotSlotModal
        open={!!depotPostId}
        onClose={() => setDepotPostId(null)}
        onConfirm={handleDepotConfirm}
        loading={depotLoading}
      />
    </div>
  );
}
