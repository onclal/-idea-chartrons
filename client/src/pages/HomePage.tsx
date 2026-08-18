import { Link } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { EventType, getFideliteNiveau } from '@idea-chartrons/shared';
import type { AgendaEvenement, LocalRelais, PostAnnonce } from '@idea-chartrons/shared';
import { Badge, Card, Loading } from '../components/ui';
import { PageHelp } from '../components/PageHelp';
import { PickupAlert } from '../components/PickupAlert';
import { HeroSearch } from '../components/HeroSearch';
import { FaqModal } from '../components/FaqModal';
import { ConfortDashboard } from '../components/ConfortDashboard';
import { useConfort } from '../context/ConfortContext';
import { api } from '../lib/api';
import { getDeviceId, getOwnedPostIds } from '../lib/guestCarnet';

function isUpcomingBrocante(event: AgendaEvenement): boolean {
  if (event.type !== EventType.Brocante) return false;
  const start = new Date(event.dateDebut);
  const now = new Date();
  const inSevenDays = new Date(now.getTime() + 7 * 86400000);
  return start >= now && start <= inSevenDays;
}

export function HomePage() {
  const { t } = useTranslation();
  const { isConfortMode } = useConfort();
  const [stats, setStats] = useState({ posts: 0, acteurs: 0, events: 0 });
  const [carnetPoints, setCarnetPoints] = useState(0);
  const [relaisList, setRelaisList] = useState<LocalRelais[]>([]);
  const [posts, setPosts] = useState<PostAnnonce[]>([]);
  const [weekendBrocante, setWeekendBrocante] = useState(false);
  const [loading, setLoading] = useState(true);
  const [faqOpen, setFaqOpen] = useState(false);

  const ownedPostIds = getOwnedPostIds();

  useEffect(() => {
    Promise.all([
      api.getPosts(),
      api.getActeurs(),
      api.getEvents(),
      api.getRelais(),
      api.getCarnetPoints(getDeviceId()),
    ])
      .then(([postsData, acteurs, events, relais, points]) => {
        setStats({
          posts: postsData.filter((p) => p.statut === 'Disponible').length,
          acteurs: acteurs.length,
          events: events.filter((e) => new Date(e.dateFin) >= new Date()).length,
        });
        setRelaisList(relais);
        setPosts(postsData);
        setCarnetPoints(points);
        setWeekendBrocante(events.some(isUpcomingBrocante));
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  if (isConfortMode) {
    return (
      <div className="space-y-6 animate-fade-in">
        {!loading && (
          <PickupAlert relaisList={relaisList} posts={posts} ownedPostIds={ownedPostIds} />
        )}
        <ConfortDashboard />
      </div>
    );
  }

  if (loading) return <Loading message={t('common.loading')} />;

  const niveau = getFideliteNiveau(carnetPoints);

  const ctaLinks = [
    { to: '/posts', label: t('home.cta.posts'), icon: '📋', gradient: 'from-chartrons-bordeaux to-chartrons-brick' },
    { to: '/decouvrir', label: t('home.cta.decouvrir'), icon: '🚶', gradient: 'from-chartrons-olive to-chartrons-olive-light' },
    { to: '/pratique', label: t('home.cta.pratique'), icon: 'ℹ️', gradient: 'from-chartrons-brass to-chartrons-olive' },
    { to: '/conciergerie', label: t('home.cta.conciergerie'), icon: '🔑', gradient: 'from-chartrons-brass to-chartrons-olive' },
    { to: '/carte', label: t('home.cta.carte'), icon: '🗺️', gradient: 'from-chartrons-olive to-chartrons-olive-light' },
    { to: '/acteurs', label: t('home.cta.acteurs'), icon: '🏪', gradient: 'from-chartrons-brass to-chartrons-brick-light' },
    { to: '/favoris', label: t('home.cta.favoris'), icon: '♥', gradient: 'from-chartrons-bordeaux to-chartrons-olive-dark' },
    { to: '/favoris#parcours', label: t('home.cta.parcours'), icon: '🗺️', gradient: 'from-chartrons-brass to-chartrons-bordeaux' },
    { to: '/events', label: t('home.cta.events'), icon: '📅', gradient: 'from-chartrons-bordeaux-light to-chartrons-bordeaux' },
    { to: '/faq', label: t('home.cta.faq'), icon: '❓', gradient: 'from-chartrons-olive-dark to-chartrons-olive' },
  ];

  return (
    <div className="space-y-6 animate-fade-in">
      <PickupAlert relaisList={relaisList} posts={posts} ownedPostIds={ownedPostIds} />

      {weekendBrocante && (
        <div className="flex justify-center">
          <Badge variant="brocante" icon="🎪">{t('badges.brocante')}</Badge>
        </div>
      )}

      <section className="text-center py-2 relative">
        <div className="absolute top-0 right-0">
          <PageHelp page="home" />
        </div>
        <div className="inline-flex items-center justify-center w-20 h-20 rounded-3xl bg-gradient-to-br from-chartrons-beige to-chartrons-sand mb-4 shadow-card">
          <span className="text-4xl" aria-hidden>🏘️</span>
        </div>
        <h2 className="text-2xl font-bold text-chartrons-bordeaux mb-2">{t('home.welcome')}</h2>
        <p className="text-chartrons-warm-gray text-sm leading-relaxed max-w-xs mx-auto">
          {t('home.description')}
        </p>
        <div className="flex items-center justify-center gap-2 mt-3 flex-wrap">
          <Badge variant="brass" icon="🙋">{t('guest.badge')}</Badge>
          <p className="text-xs text-chartrons-warm-gray">{t('guest.noAccount')}</p>
        </div>
        <button
          type="button"
          onClick={() => setFaqOpen(true)}
          className="mt-2 text-xs font-semibold text-chartrons-green underline-offset-2 hover:underline"
        >
          {t('faq.comparisonTitle')}
        </button>
      </section>

      <HeroSearch variant="hero" />

      <section className="grid grid-cols-2 gap-3">
        {[
          { value: stats.posts, label: t('home.stats.posts'), color: 'text-chartrons-bordeaux' },
          { value: stats.acteurs, label: t('home.stats.acteurs'), color: 'text-chartrons-olive' },
          { value: stats.events, label: t('home.stats.events'), color: 'text-chartrons-brick' },
          { value: carnetPoints, label: t('fidelite.yourPoints'), color: 'text-chartrons-brass' },
        ].map(({ value, label, color }) => (
          <Card key={label} className="text-center !p-4">
            <p className={`text-2xl font-bold ${color}`}>{value}</p>
            <p className="text-[10px] text-chartrons-warm-gray mt-1 leading-tight font-medium uppercase tracking-wide">
              {label}
            </p>
          </Card>
        ))}
      </section>

      <Card className="!p-4 flex items-center justify-between bg-gradient-to-r from-chartrons-beige/50 to-white">
        <span className="text-sm text-chartrons-warm-gray">{t('fidelite.level')}</span>
        <Badge variant="brass">{t(`fidelite.levels.${niveau}`)}</Badge>
      </Card>

      <section className="space-y-3">
        {ctaLinks.map(({ to, label, icon, gradient }) => (
          <Link key={to} to={to}>
            <Card className="flex items-center gap-4 !p-4 hover:shadow-card-hover">
              <div
                className={`w-12 h-12 rounded-2xl bg-gradient-to-br ${gradient} flex items-center justify-center text-white text-xl shadow-sm`}
              >
                {icon}
              </div>
              <span className="font-semibold text-chartrons-olive-dark">{label}</span>
              <span className="ml-auto text-chartrons-warm-gray text-lg">→</span>
            </Card>
          </Link>
        ))}
      </section>

      <section className="rounded-2xl bg-gradient-to-br from-chartrons-bordeaux to-chartrons-olive-dark p-5 text-white shadow-card">
        <p className="text-sm font-medium opacity-95">{t('app.tagline')}</p>
        <p className="text-xs opacity-60 mt-1.5">{t('home.areaHint')}</p>
      </section>

      <FaqModal open={faqOpen} onClose={() => setFaqOpen(false)} />
    </div>
  );
}
