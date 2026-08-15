import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import type { AgendaEvenement, LocalRelais, PostAnnonce, User } from '@idea-chartrons/shared';
import { AdminPageHeader } from '../../components/admin/AdminPageHeader';
import { Badge, Button, Card, Loading } from '../../components/ui';
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
  const [users, setUsers] = useState<User[]>([]);
  const [posts, setPosts] = useState<PostAnnonce[]>([]);
  const [acteursCount, setActeursCount] = useState(0);
  const [events, setEvents] = useState<AgendaEvenement[]>([]);
  const [relais, setRelais] = useState<LocalRelais[]>([]);
  const [scansCount, setScansCount] = useState(0);
  const [messages, setMessages] = useState<ContactMessage[]>([]);

  const load = () => {
    setLoading(true);
    Promise.all([
      api.getUsers(),
      api.getPosts(),
      api.getActeurs(),
      api.getEvents(),
      api.getRelais(),
      api.getFidelite(),
      api.getContactMessages(),
    ])
      .then(([usersData, postsData, acteurs, eventsData, relaisData, scans, inbox]) => {
        setUsers(usersData);
        setPosts(postsData);
        setActeursCount(acteurs.length);
        setEvents(eventsData);
        setRelais(relaisData);
        setScansCount(scans.length);
        setMessages(inbox);
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

  if (loading) return <Loading message={t('common.loading')} />;

  const pendingRelais = relais.filter((r) => r.statutRetrait !== 'Récupéré');
  const upcomingEvents = [...events]
    .filter((e) => new Date(e.dateFin).getTime() >= Date.now())
    .sort((a, b) => new Date(a.dateDebut).getTime() - new Date(b.dateDebut).getTime())
    .slice(0, 4);
  const recentPosts = [...posts]
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 4);

  const kpis = [
    { value: users.length, label: t('adminSpace.dashboard.kpis.users'), color: 'text-chartrons-bordeaux' },
    { value: posts.length, label: t('adminSpace.dashboard.kpis.posts'), color: 'text-chartrons-olive' },
    { value: acteursCount, label: t('adminSpace.dashboard.kpis.acteurs'), color: 'text-chartrons-brick' },
    { value: events.length, label: t('adminSpace.dashboard.kpis.events'), color: 'text-chartrons-brass' },
    { value: pendingRelais.length, label: t('adminSpace.dashboard.kpis.relais'), color: 'text-chartrons-bordeaux' },
    { value: scansCount, label: t('adminSpace.dashboard.kpis.scans'), color: 'text-chartrons-olive' },
  ];

  return (
    <div className="space-y-6 lg:space-y-8 animate-fade-in">
      <AdminPageHeader
        title={t('adminSpace.dashboard.welcome')}
        subtitle={t('adminSpace.dashboard.welcomeSub')}
      />

      <section className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-3 lg:gap-4">
        {kpis.map((kpi) => (
          <Card key={kpi.label} className="text-center !p-4 lg:!p-5">
            <p className={`text-2xl lg:text-3xl font-bold ${kpi.color}`}>{kpi.value}</p>
            <p className="text-[10px] lg:text-xs text-chartrons-warm-gray mt-1 font-medium uppercase tracking-wide leading-tight">
              {kpi.label}
            </p>
          </Card>
        ))}
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
