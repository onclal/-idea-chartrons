import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import type { AgendaEvenement, LocalRelais, PostAnnonce, TourDeControleStats } from '@idea-chartrons/shared';
import { AdminPageHeader } from '../../components/admin/AdminPageHeader';
import { Badge, Button, Card, Input, Loading } from '../../components/ui';
import { useToast } from '../../context/ToastContext';
import { api } from '../../lib/api';
import type { ContactMessage } from '../../lib/contact';
import { formatDateTime } from '../../lib/format';

const QUICK_LINKS = [
  { to: '/admin/annonces', key: 'posts', icon: '📋' },
  { to: '/admin/commerces', key: 'acteurs', icon: '🏪' },
  { to: '/admin/agenda', key: 'events', icon: '📅' },
  { to: '/admin/relais', key: 'relais', icon: '📦' },
  { to: '/admin/utilisateurs', key: 'users', icon: '👥' },
] as const;

export function AdminDashboardPage() {
  const { t, i18n } = useTranslation();
  const { showToast } = useToast();
  const [loading, setLoading] = useState(true);
  const [resetting, setResetting] = useState(false);
  const [posts, setPosts] = useState<PostAnnonce[]>([]);
  const [events, setEvents] = useState<AgendaEvenement[]>([]);
  const [relais, setRelais] = useState<LocalRelais[]>([]);
  const [messages, setMessages] = useState<ContactMessage[]>([]);
  const [stats, setStats] = useState<TourDeControleStats | null>(null);
  const [transactionFee, setTransactionFee] = useState('1');
  const [savingFee, setSavingFee] = useState(false);

  const load = () => {
    setLoading(true);
    Promise.all([
      api.getPosts(),
      api.getEvents(),
      api.getRelais(),
      api.getContactMessages(),
      api.getTourDeControle(),
      api.getPlatformSettings(),
    ])
      .then(([postsData, eventsData, relaisData, inbox, tour, platform]) => {
        setPosts(postsData);
        setEvents(eventsData);
        setRelais(relaisData);
        setMessages(inbox);
        setStats(tour);
        setTransactionFee(String(platform.transactionFee));
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  };

  useEffect(load, []);

  const handleReset = async () => {
    if (!window.confirm(t('profile.resetConfirm'))) return;
    setResetting(true);
    try {
      await api.resetDemoData();
      load();
      showToast(t('toast.dataReset'));
    } catch (err) {
      showToast(err instanceof Error ? err.message : t('common.error'), 'error');
    } finally {
      setResetting(false);
    }
  };

  const handleSaveFee = async () => {
    const nextFee = Number(String(transactionFee).replace(',', '.'));
    if (!Number.isFinite(nextFee) || nextFee < 0) {
      showToast(t('adminSpace.fees.invalid'), 'error');
      return;
    }
    setSavingFee(true);
    try {
      const saved = await api.updatePlatformSettings({ transactionFee: nextFee });
      setTransactionFee(String(saved.transactionFee));
      showToast(t('toast.transactionFeeSaved'));
    } catch (err) {
      showToast(err instanceof Error ? err.message : t('common.error'), 'error');
    } finally {
      setSavingFee(false);
    }
  };

  if (loading || !stats) return <Loading message={t('common.loading')} />;

  const pendingRelais = relais.filter((r) => r.statutRetrait !== 'Récupéré');
  const upcomingEvents = [...events]
    .filter((e) => new Date(e.dateFin).getTime() >= Date.now())
    .sort((a, b) => new Date(a.dateDebut).getTime() - new Date(b.dateDebut).getTime())
    .slice(0, 4);
  const recentPosts = [...posts]
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 4);

  const maxCommercePoints = Math.max(1, ...stats.commercesActifs.map((item) => item.points));
  const heroKpis = [
    {
      icon: '⭐',
      value: stats.pointsDistribues,
      label: t('adminSpace.dashboard.kpis.points'),
      hint: t('adminSpace.dashboard.kpis.pointsHint', {
        credits: stats.creditsEnregistres,
        viaCredits: stats.pointsViaCredits,
      }),
      accent: 'text-chartrons-brass',
    },
    {
      icon: '🎁',
      value: `${stats.privilegesDebloques} / ${stats.privilegesConsommes}`,
      label: t('adminSpace.dashboard.kpis.privileges'),
      hint: t('adminSpace.dashboard.kpis.privilegesHint', {
        unlocked: stats.privilegesDebloques,
        consumed: stats.privilegesConsommes,
      }),
      accent: 'text-chartrons-bordeaux',
    },
    {
      icon: '🏪',
      value: stats.commercesActifs.length,
      label: t('adminSpace.dashboard.kpis.ranking'),
      hint: t('adminSpace.dashboard.kpis.rankingHint', { count: stats.commercesActifs.length }),
      accent: 'text-chartrons-olive',
    },
    {
      icon: '📦',
      value: `${stats.annonces} / ${stats.relaisTotal}`,
      label: t('adminSpace.dashboard.kpis.sharing'),
      hint: t('adminSpace.dashboard.kpis.sharingHint', {
        posts: stats.annonces,
        relais: stats.relaisTotal,
      }),
      accent: 'text-chartrons-brick',
    },
  ];

  return (
    <div className="space-y-6 lg:space-y-8 animate-fade-in">
      <AdminPageHeader
        title={t('adminSpace.dashboard.welcome')}
        subtitle={t('adminSpace.dashboard.welcomeSub')}
      />

      <section className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3 lg:gap-4">
        {heroKpis.map((kpi) => (
          <Card key={kpi.label} className="!p-4 lg:!p-5 bg-chartrons-beige/35 border-chartrons-beige">
            <div className="flex items-start gap-3">
              <div className="w-11 h-11 rounded-2xl bg-white border border-chartrons-beige flex items-center justify-center text-xl shrink-0 shadow-sm">
                <span aria-hidden>{kpi.icon}</span>
              </div>
              <div className="min-w-0">
                <p className={`text-2xl lg:text-3xl font-bold leading-none ${kpi.accent}`}>{kpi.value}</p>
                <p className="text-xs font-semibold text-chartrons-olive-dark mt-1.5 uppercase tracking-wide">
                  {kpi.label}
                </p>
                <p className="text-[11px] text-chartrons-warm-gray mt-1 leading-snug">{kpi.hint}</p>
              </div>
            </div>
          </Card>
        ))}
      </section>

      <section className="grid grid-cols-1 xl:grid-cols-2 gap-4 lg:gap-6">
        <Card className="!p-4 lg:!p-5">
          <h2 className="font-semibold text-chartrons-bordeaux">{t('adminSpace.dashboard.privilegesTitle')}</h2>
          <p className="text-xs text-chartrons-warm-gray mt-1 mb-4">{t('adminSpace.dashboard.privilegesSub')}</p>
          {stats.privilegeOffres.length === 0 ? (
            <p className="text-sm text-chartrons-warm-gray">{t('adminSpace.dashboard.empty')}</p>
          ) : (
            <ul className="space-y-3">
              {stats.privilegeOffres.map((offer) => (
                <li
                  key={offer.commerceId}
                  className="rounded-xl border border-chartrons-beige bg-chartrons-stone/50 p-3"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-chartrons-olive-dark truncate">{offer.offreVip}</p>
                      <p className="text-xs text-chartrons-warm-gray truncate">{offer.commerceNom}</p>
                    </div>
                    <div className="flex gap-1.5 shrink-0">
                      <Badge variant="olive">{offer.debloques} {t('adminSpace.dashboard.unlocked')}</Badge>
                      <Badge variant="brass">{offer.consommes} {t('adminSpace.dashboard.consumed')}</Badge>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </Card>

        <Card className="!p-4 lg:!p-5">
          <h2 className="font-semibold text-chartrons-bordeaux">{t('adminSpace.dashboard.rankingTitle')}</h2>
          <p className="text-xs text-chartrons-warm-gray mt-1 mb-4">{t('adminSpace.dashboard.rankingSub')}</p>
          {stats.commercesActifs.length === 0 ? (
            <p className="text-sm text-chartrons-warm-gray">{t('adminSpace.dashboard.rankingEmpty')}</p>
          ) : (
            <ol className="space-y-3">
              {stats.commercesActifs.map((commerce, index) => (
                <li key={commerce.commerceId}>
                  <div className="flex items-center justify-between gap-3 mb-1.5">
                    <p className="text-sm font-medium text-chartrons-olive-dark truncate">
                      <span className="text-chartrons-brass font-bold mr-2">{index + 1}.</span>
                      {commerce.commerceNom}
                    </p>
                    <p className="text-xs font-semibold text-chartrons-olive-dark whitespace-nowrap">
                      {t('adminSpace.dashboard.rankingPoints', { points: commerce.points })}
                    </p>
                  </div>
                  <div className="h-2 rounded-full bg-chartrons-beige overflow-hidden">
                    <div
                      className="h-full rounded-full bg-chartrons-olive"
                      style={{ width: `${Math.round((commerce.points / maxCommercePoints) * 100)}%` }}
                    />
                  </div>
                  <p className="text-[11px] text-chartrons-warm-gray mt-1">
                    {t('adminSpace.dashboard.rankingCredits', { count: commerce.credits })}
                  </p>
                </li>
              ))}
            </ol>
          )}
        </Card>
      </section>

      <section className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Card className="text-center !p-4">
          <p className="text-2xl font-bold text-chartrons-olive">{stats.annonces}</p>
          <p className="text-[10px] font-semibold uppercase tracking-wide text-chartrons-warm-gray mt-1">
            {t('adminSpace.dashboard.sharingPosts')}
          </p>
        </Card>
        <Card className="text-center !p-4">
          <p className="text-2xl font-bold text-chartrons-bordeaux">{stats.relaisTotal}</p>
          <p className="text-[10px] font-semibold uppercase tracking-wide text-chartrons-warm-gray mt-1">
            {t('adminSpace.dashboard.sharingRelais')}
          </p>
        </Card>
        <Card className="text-center !p-4">
          <p className="text-2xl font-bold text-chartrons-brass">{stats.relaisEnCours}</p>
          <p className="text-[10px] font-semibold uppercase tracking-wide text-chartrons-warm-gray mt-1">
            {t('adminSpace.dashboard.sharingPending')}
          </p>
        </Card>
        <Card className="text-center !p-4">
          <p className="text-2xl font-bold text-chartrons-olive-dark">{stats.relaisRecuperes}</p>
          <p className="text-[10px] font-semibold uppercase tracking-wide text-chartrons-warm-gray mt-1">
            {t('adminSpace.dashboard.sharingDone')}
          </p>
        </Card>
      </section>

      <section>
        <h2 className="text-sm font-semibold text-chartrons-warm-gray uppercase tracking-wide mb-3">
          {t('adminSpace.dashboard.quickActions')}
        </h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-5 gap-3">
          {QUICK_LINKS.map((link) => (
            <Link key={link.to} to={link.to}>
              <Card className="flex items-center gap-3 !p-4 h-full hover:shadow-card-hover">
                <span className="text-xl" aria-hidden>
                  {link.icon}
                </span>
                <span className="text-sm font-semibold text-chartrons-olive-dark">
                  {t(`adminSpace.nav.${link.key}`)}
                </span>
              </Card>
            </Link>
          ))}
        </div>
      </section>

      <Card className="!p-4 lg:!p-5 space-y-3">
        <div>
          <h2 className="font-semibold text-chartrons-bordeaux">{t('adminSpace.fees.title')}</h2>
          <p className="text-sm text-chartrons-warm-gray mt-1">{t('adminSpace.fees.hint')}</p>
        </div>
        <div className="flex flex-col sm:flex-row sm:items-end gap-3">
          <div className="flex-1">
            <Input
              type="number"
              min={0}
              step="0.10"
              inputMode="decimal"
              label={t('adminSpace.fees.amount')}
              value={transactionFee}
              onChange={(event) => setTransactionFee(event.target.value)}
            />
          </div>
          <Button
            type="button"
            variant="bordeaux"
            className="w-full sm:w-auto"
            disabled={savingFee}
            onClick={handleSaveFee}
          >
            {savingFee ? t('common.loading') : t('adminSpace.fees.save')}
          </Button>
        </div>
      </Card>

      <section className="grid grid-cols-1 xl:grid-cols-2 gap-4 lg:gap-6">
        <Card className="!p-4 lg:!p-5">
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-semibold text-chartrons-bordeaux">{t('adminSpace.dashboard.recentPosts')}</h2>
            <Link to="/admin/annonces" className="text-xs font-semibold text-chartrons-olive hover:underline">
              {t('adminSpace.dashboard.seeAll')}
            </Link>
          </div>
          {recentPosts.length === 0 ? (
            <p className="text-sm text-chartrons-warm-gray">{t('adminSpace.dashboard.empty')}</p>
          ) : (
            <ul className="space-y-3">
              {recentPosts.map((post) => (
                <li key={post.id} className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-chartrons-olive-dark truncate">{post.titre}</p>
                    <p className="text-xs text-chartrons-warm-gray">
                      {formatDateTime(post.createdAt, i18n.language)}
                    </p>
                  </div>
                  <Badge variant={post.statut === 'Disponible' ? 'olive' : 'stone'}>
                    {t(`posts.status.${post.statut}`)}
                  </Badge>
                </li>
              ))}
            </ul>
          )}
        </Card>

        <Card className="!p-4 lg:!p-5">
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-semibold text-chartrons-bordeaux">{t('adminSpace.dashboard.recentEvents')}</h2>
            <Link to="/admin/agenda" className="text-xs font-semibold text-chartrons-olive hover:underline">
              {t('adminSpace.dashboard.seeAll')}
            </Link>
          </div>
          {upcomingEvents.length === 0 ? (
            <p className="text-sm text-chartrons-warm-gray">{t('adminSpace.dashboard.empty')}</p>
          ) : (
            <ul className="space-y-3">
              {upcomingEvents.map((event) => (
                <li key={event.id} className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-chartrons-olive-dark truncate">{event.titre}</p>
                    <p className="text-xs text-chartrons-warm-gray">
                      {formatDateTime(event.dateDebut, i18n.language)}
                    </p>
                  </div>
                  <Badge variant="brick">{t(`events.types.${event.type}`)}</Badge>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </section>

      <Card className="!p-4 lg:!p-5">
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-semibold text-chartrons-bordeaux">{t('adminSpace.dashboard.pendingRelais')}</h2>
          <Link to="/admin/relais" className="text-xs font-semibold text-chartrons-olive hover:underline">
            {t('adminSpace.dashboard.seeAll')}
          </Link>
        </div>
        {pendingRelais.length === 0 ? (
          <p className="text-sm text-chartrons-warm-gray">{t('adminSpace.dashboard.empty')}</p>
        ) : (
          <ul className="space-y-3">
            {pendingRelais.map((item) => {
              const post = posts.find((p) => p.id === item.postId);
              return (
                <li key={item.id} className="flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-chartrons-olive-dark truncate">
                      {post?.titre ?? item.postId}
                    </p>
                    <p className="text-xs text-chartrons-warm-gray font-mono">{item.codeQrValidation}</p>
                  </div>
                  <Badge variant={item.statutRetrait === 'Disponible_Au_Local' ? 'local' : 'stone'}>
                    {t(`relais.status.${item.statutRetrait}`)}
                  </Badge>
                </li>
              );
            })}
          </ul>
        )}
      </Card>

      <Card className="!p-4 lg:!p-5">
        <h2 className="font-semibold text-chartrons-bordeaux mb-3">{t('adminSpace.dashboard.messages')}</h2>
        {messages.length === 0 ? (
          <p className="text-sm text-chartrons-warm-gray">{t('adminSpace.dashboard.noMessages')}</p>
        ) : (
          <ul className="space-y-3">
            {messages.slice(0, 6).map((msg) => (
              <li key={msg.id} className="rounded-xl border border-chartrons-beige bg-chartrons-stone/60 p-3">
                <div className="flex items-start justify-between gap-2">
                  <p className="text-sm font-semibold text-chartrons-olive-dark">{msg.name}</p>
                  <span className="text-[11px] text-chartrons-warm-gray whitespace-nowrap">
                    {formatDateTime(msg.createdAt, i18n.language)}
                  </span>
                </div>
                <p className="text-xs text-chartrons-warm-gray">{msg.email} · {msg.context}</p>
                <p className="text-sm text-chartrons-olive-dark mt-1.5 leading-relaxed">{msg.message}</p>
              </li>
            ))}
          </ul>
        )}
      </Card>

      <Card className="!p-4 lg:!p-5">
        <p className="text-sm text-chartrons-warm-gray mb-3">{t('profile.resetHint')}</p>
        <Button variant="secondary" disabled={resetting} onClick={handleReset} className="w-full sm:w-auto">
          {resetting ? t('common.loading') : t('adminSpace.dashboard.reset')}
        </Button>
      </Card>
    </div>
  );
}
