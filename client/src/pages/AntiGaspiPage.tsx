import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  PostStatus,
  isActiveAntiGaspiOffer,
  type PostAnnonce,
} from '@idea-chartrons/shared';
import { Badge, Button, Card, EmptyState, Loading } from '../components/ui';
import { PageHelp } from '../components/PageHelp';
import { toTelHref } from '../lib/phone';
import { AntiGaspiCreateForm } from '../components/AntiGaspiCreateForm';
import { CheckoutModal } from '../components/CheckoutModal';
import { AdminDeleteButton } from '../components/AdminDeleteButton';
import { OwnerPostActions } from '../components/OwnerPostActions';
import { useToast } from '../context/ToastContext';
import { api } from '../lib/api';
import { formatDateTime, formatEuro } from '../lib/format';
import { ownsPost } from '../lib/guestCarnet';

export function AntiGaspiPage() {
  const { t, i18n } = useTranslation();
  const { showToast } = useToast();
  const [posts, setPosts] = useState<PostAnnonce[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [checkoutPost, setCheckoutPost] = useState<PostAnnonce | null>(null);

  const load = (opts?: { silent?: boolean }) => {
    if (!opts?.silent) setLoading(true);
    api
      .getPosts()
      .then(setPosts)
      .catch(console.error)
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    load();
  }, []);

  const offers = useMemo(
    () =>
      posts
        .filter((post) => isActiveAntiGaspiOffer(post) || (ownsPost(post.id) && post.type === 'Anti_Gaspi'))
        .sort((a, b) => {
          const aExp = a.expiresAt ? Date.parse(a.expiresAt) : Number.MAX_SAFE_INTEGER;
          const bExp = b.expiresAt ? Date.parse(b.expiresAt) : Number.MAX_SAFE_INTEGER;
          return aExp - bExp;
        }),
    [posts],
  );

  const handleDelete = async (postId: string) => {
    await api.deletePost(postId);
    load({ silent: true });
    showToast(t('admin.deleteSuccess'));
  };

  if (loading) return <Loading message={t('common.loading')} />;

  return (
    <div className="space-y-4 animate-fade-in">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-bold text-chartrons-bordeaux">{t('antigaspi.title')}</h2>
            <PageHelp page="antigaspi" />
          </div>
          <p className="text-sm text-chartrons-warm-gray mt-1 leading-relaxed">{t('antigaspi.subtitle')}</p>
        </div>
        <Button size="sm" variant="bordeaux" onClick={() => setShowCreate(true)}>
          + {t('antigaspi.publish')}
        </Button>
      </div>

      <Card className="!p-4 bg-gradient-to-br from-chartrons-beige/70 to-white">
        <p className="text-sm text-chartrons-olive-dark leading-relaxed">{t('antigaspi.studentHint')}</p>
        <Link to="/posts" className="inline-flex mt-2 text-xs font-semibold text-chartrons-green underline-offset-2 hover:underline">
          {t('antigaspi.backToResidents')} →
        </Link>
      </Card>

      {offers.length === 0 ? (
        <EmptyState
          icon="♻️"
          title={t('antigaspi.emptyTitle')}
          message={t('antigaspi.emptyHint')}
          action={{ label: `+ ${t('antigaspi.publish')}`, onClick: () => setShowCreate(true) }}
        />
      ) : (
        <div className="space-y-3">
          {offers.map((post) => {
            const isOwner = ownsPost(post.id);
            const active = isActiveAntiGaspiOffer(post);
            const shop = post.commerceNom || post.auteurNom;

            return (
              <Card key={post.id} className="!p-0 overflow-hidden">
                {post.photos[0] && (
                  <div className="relative">
                    <img src={post.photos[0]} alt="" className="w-full h-40 object-cover" />
                    <div className="absolute top-3 left-3">
                      <Badge variant="olive" icon="♻️">
                        {t('antigaspi.badge')}
                      </Badge>
                    </div>
                  </div>
                )}
                <div className="p-4 space-y-3">
                  {!post.photos[0] && (
                    <Badge variant="olive" icon="♻️">
                      {t('antigaspi.badge')}
                    </Badge>
                  )}
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <h3 className="font-semibold text-chartrons-olive-dark text-base leading-snug">{post.titre}</h3>
                      {shop && <p className="text-xs text-chartrons-warm-gray mt-1">{shop}</p>}
                    </div>
                    <Badge variant={active ? 'olive' : post.statut === PostStatus.EnAttente ? 'gold' : 'stone'}>
                      {t(`posts.status.${post.statut}`)}
                    </Badge>
                  </div>
                  <p className="text-sm text-chartrons-warm-gray leading-relaxed">{post.description}</p>
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-base font-bold text-chartrons-bordeaux">
                      {post.prix != null ? formatEuro(post.prix, i18n.language) : t('posts.free')}
                    </span>
                    {post.expiresAt && (
                      <p className="text-xs text-chartrons-warm-gray">
                        {t('antigaspi.expires', { date: formatDateTime(post.expiresAt, i18n.language) })}
                      </p>
                    )}
                  </div>
                  {active && !isOwner && (
                    <div className="space-y-2">
                      {post.prix != null && post.prix > 0 && (
                        <Button
                          variant="bordeaux"
                          size="md"
                          className="w-full"
                          onClick={() => setCheckoutPost(post)}
                        >
                          💳 {t('antigaspi.payOnline')}
                        </Button>
                      )}
                      {post.telephone ? (
                        <a
                          href={toTelHref(post.telephone)}
                          className="inline-flex items-center justify-center gap-2 w-full min-h-[44px] px-4 py-2 rounded-xl border border-chartrons-beige bg-white text-chartrons-olive-dark text-sm font-semibold hover:bg-chartrons-stone touch-target"
                        >
                          📞 {t('antigaspi.callReserve')}
                        </a>
                      ) : null}
                      <p className="text-[11px] text-chartrons-warm-gray leading-relaxed">
                        {t('antigaspi.dualHint')}
                      </p>
                    </div>
                  )}
                  {isOwner && (
                    <OwnerPostActions post={post} onDeleted={() => load({ silent: true })} />
                  )}
                  {!isOwner && (
                    <AdminDeleteButton
                      label={t('admin.deletePost')}
                      confirmMessage={t('admin.deletePostConfirm', { title: post.titre })}
                      onDelete={() => handleDelete(post.id)}
                    />
                  )}
                </div>
              </Card>
            );
          })}
        </div>
      )}

      <AntiGaspiCreateForm
        open={showCreate}
        onClose={() => setShowCreate(false)}
        onCreated={() => load({ silent: true })}
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
                sellerName: checkoutPost.commerceNom ?? checkoutPost.auteurNom ?? undefined,
                kind: 'anti_gaspi',
                icon: '♻️',
              }
            : null
        }
        onClose={() => setCheckoutPost(null)}
        onConfirm={async (item) => {
          await api.updatePost(item.id, { statut: PostStatus.Reserve });
          load({ silent: true });
          showToast(t('antigaspi.reservedToast'));
        }}
      />
    </div>
  );
}
