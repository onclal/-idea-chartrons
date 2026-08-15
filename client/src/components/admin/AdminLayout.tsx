import { useState, type FormEvent } from 'react';
import { Link, NavLink, Outlet, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAdmin } from '../../context/AdminContext';
import { useToast } from '../../context/ToastContext';
import { Badge, Button, Input } from '../ui';
import { ToastContainer } from '../ToastContainer';

const NAV_ITEMS = [
  { to: '/admin', icon: '📊', key: 'overview', end: true },
  { to: '/admin/annonces', icon: '📋', key: 'posts', end: false },
  { to: '/admin/commerces', icon: '🏪', key: 'acteurs', end: false },
  { to: '/admin/agenda', icon: '📅', key: 'events', end: false },
  { to: '/admin/relais', icon: '📦', key: 'relais', end: false },
  { to: '/admin/utilisateurs', icon: '👥', key: 'users', end: false },
] as const;

function AdminLoginScreen() {
  const { t } = useTranslation();
  const { login } = useAdmin();
  const { showToast } = useToast();
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (login(password)) {
      setPassword('');
      setError('');
      showToast(t('admin.loginSuccess'), 'info');
      return;
    }
    setError(t('adminSpace.login.error'));
  };

  return (
    <div className="min-h-dvh flex flex-col items-center justify-center px-4 py-10 safe-top safe-bottom">
      <ToastContainer className="top-4" />
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 sm:w-20 sm:h-20 rounded-3xl bg-gradient-to-br from-chartrons-green-dark to-chartrons-green text-white text-3xl shadow-card mb-4">
            🛡️
          </div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-chartrons-brass mb-2">
            IDÉA CHARTRONS
          </p>
          <h1 className="text-2xl sm:text-3xl font-bold text-chartrons-bordeaux">
            {t('adminSpace.login.title')}
          </h1>
          <p className="text-sm text-chartrons-warm-gray mt-2 leading-relaxed px-2">
            {t('adminSpace.login.subtitle')}
          </p>
        </div>

        <form
          onSubmit={handleSubmit}
          className="bg-white/90 backdrop-blur-sm rounded-3xl shadow-card border border-chartrons-beige p-5 sm:p-8 space-y-5"
        >
          <div className="relative">
            <Input
              type={showPassword ? 'text' : 'password'}
              label={t('adminSpace.login.password')}
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
                setError('');
              }}
              placeholder="••••••••"
              autoComplete="current-password"
              autoFocus
              className="pr-20"
            />
            <button
              type="button"
              onClick={() => setShowPassword((v) => !v)}
              className="absolute right-3 bottom-2.5 touch-target px-2 text-xs font-semibold text-chartrons-warm-gray hover:text-chartrons-bordeaux"
            >
              {showPassword ? t('adminSpace.login.hide') : t('adminSpace.login.show')}
            </button>
          </div>
          {error && (
            <p className="text-sm text-chartrons-brick font-medium" role="alert">
              {error}
            </p>
          )}
          <Button type="submit" variant="bordeaux" size="lg" className="w-full">
            {t('adminSpace.login.submit')}
          </Button>
        </form>

        <div className="text-center mt-6">
          <Link
            to="/"
            className="inline-flex items-center justify-center min-h-[44px] text-sm font-medium text-chartrons-warm-gray hover:text-chartrons-bordeaux transition-colors"
          >
            ← {t('adminSpace.login.back')}
          </Link>
        </div>
      </div>
    </div>
  );
}

function NavItems({ onNavigate }: { onNavigate?: () => void }) {
  const { t } = useTranslation();
  const location = useLocation();

  return (
    <>
      {NAV_ITEMS.map((item) => {
        const isActive = item.end
          ? location.pathname === item.to
          : location.pathname === item.to || location.pathname.startsWith(`${item.to}/`);

        return (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.end}
            onClick={onNavigate}
            className={`flex items-center gap-3 rounded-xl px-3 py-2.5 min-h-[44px] text-sm font-medium transition-colors ${
              isActive
                ? 'bg-white/15 text-white shadow-sm'
                : 'text-white/75 hover:bg-white/10 hover:text-white'
            }`}
          >
            <span className="text-lg w-7 text-center" aria-hidden>
              {item.icon}
            </span>
            <span>{t(`adminSpace.nav.${item.key}`)}</span>
          </NavLink>
        );
      })}
    </>
  );
}

export function AdminLayout() {
  const { t, i18n } = useTranslation();
  const { isAdminMode, logout } = useAdmin();
  const { showToast } = useToast();
  const location = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);

  const handleLogout = () => {
    logout();
    setMenuOpen(false);
    showToast(t('admin.logoutSuccess'), 'info');
  };

  const setLanguage = (lang: 'fr' | 'en') => {
    i18n.changeLanguage(lang);
  };

  if (!isAdminMode) {
    return <AdminLoginScreen />;
  }

  const currentNav = NAV_ITEMS.find((item) =>
    item.end ? location.pathname === item.to : location.pathname.startsWith(item.to),
  );

  return (
    <div className="min-h-dvh flex bg-chartrons-stone">
      <ToastContainer className="top-4 lg:top-6" />

      <aside className="hidden lg:flex w-[272px] xl:w-[292px] shrink-0 flex-col bg-gradient-to-b from-chartrons-green-dark via-chartrons-green to-chartrons-olive-dark text-white">
        <div className="px-5 pt-8 pb-6 border-b border-white/10">
          <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-chartrons-brass">
            IDÉA CHARTRONS
          </p>
          <h1 className="text-lg font-bold mt-1">{t('adminSpace.title')}</h1>
          <p className="text-xs text-white/60 mt-1 leading-relaxed">{t('adminSpace.subtitle')}</p>
        </div>
        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto" aria-label={t('adminSpace.title')}>
          <NavItems />
        </nav>
        <div className="px-4 py-5 border-t border-white/10 space-y-3">
          <Link
            to="/"
            className="flex items-center justify-center min-h-[44px] rounded-xl bg-white/10 text-sm font-medium hover:bg-white/15 transition-colors"
          >
            {t('adminSpace.viewSite')}
          </Link>
          <button
            type="button"
            onClick={handleLogout}
            className="w-full flex items-center justify-center min-h-[44px] rounded-xl text-sm font-medium text-white/80 hover:text-white hover:bg-white/10 transition-colors"
          >
            {t('adminSpace.logout')}
          </button>
        </div>
      </aside>

      {menuOpen && (
        <div className="lg:hidden fixed inset-0 z-50">
          <button
            type="button"
            className="absolute inset-0 bg-chartrons-olive-dark/50 backdrop-blur-sm"
            aria-label={t('common.cancel')}
            onClick={() => setMenuOpen(false)}
          />
          <aside className="relative w-[min(20rem,86vw)] h-full bg-gradient-to-b from-chartrons-green-dark to-chartrons-green text-white flex flex-col shadow-card-hover animate-slide-down">
            <div className="flex items-center justify-between px-4 pt-5 pb-4 safe-top">
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-chartrons-brass">
                  IDÉA CHARTRONS
                </p>
                <p className="font-bold">{t('adminSpace.title')}</p>
              </div>
              <button
                type="button"
                onClick={() => setMenuOpen(false)}
                className="touch-target w-10 h-10 rounded-full bg-white/10 flex items-center justify-center"
                aria-label={t('common.cancel')}
              >
                ✕
              </button>
            </div>
            <nav className="flex-1 px-3 py-2 space-y-1 overflow-y-auto">
              <NavItems onNavigate={() => setMenuOpen(false)} />
            </nav>
            <div className="px-4 py-4 pb-6 space-y-2 safe-bottom border-t border-white/10">
              <Link
                to="/"
                onClick={() => setMenuOpen(false)}
                className="flex items-center justify-center min-h-[44px] rounded-xl bg-white/10 text-sm font-medium"
              >
                {t('adminSpace.viewSite')}
              </Link>
              <button
                type="button"
                onClick={handleLogout}
                className="w-full flex items-center justify-center min-h-[44px] rounded-xl text-sm font-medium text-white/80"
              >
                {t('adminSpace.logout')}
              </button>
            </div>
          </aside>
        </div>
      )}

      <div className="flex-1 flex flex-col min-w-0">
        <header className="sticky top-0 z-40 bg-gradient-to-br from-chartrons-green-dark to-chartrons-green text-white shadow-md lg:bg-white/90 lg:from-white/90 lg:to-white/90 lg:text-chartrons-olive-dark lg:backdrop-blur-md lg:border-b lg:border-chartrons-beige lg:shadow-none">
          <div className="flex items-center gap-3 px-3 sm:px-5 h-14 lg:h-16 safe-top">
            <button
              type="button"
              className="lg:hidden touch-target w-11 h-11 rounded-xl bg-white/10 flex items-center justify-center text-lg"
              onClick={() => setMenuOpen(true)}
              aria-label={t('adminSpace.menu')}
            >
              ☰
            </button>
            <div className="flex-1 min-w-0 lg:hidden">
              <p className="text-sm font-semibold truncate">
                {currentNav ? t(`adminSpace.nav.${currentNav.key}`) : t('adminSpace.title')}
              </p>
            </div>
            <div className="hidden lg:flex flex-1 items-center gap-2">
              <Badge variant="brass" icon="🛡️">
                {t('admin.badge')}
              </Badge>
              <span className="text-sm text-chartrons-warm-gray">{t('adminSpace.subtitle')}</span>
            </div>
            <div className="flex items-center gap-1.5 shrink-0">
              <div
                className="flex items-center gap-0.5 bg-white/10 lg:bg-chartrons-beige/70 rounded-xl p-0.5"
                role="group"
                aria-label={t('common.language')}
              >
                {(['fr', 'en'] as const).map((lang) => (
                  <button
                    key={lang}
                    type="button"
                    onClick={() => setLanguage(lang)}
                    className={`touch-target px-2.5 py-1.5 rounded-lg text-[11px] font-semibold transition-all ${
                      i18n.language.startsWith(lang)
                        ? 'bg-white text-chartrons-bordeaux shadow-sm'
                        : 'text-white/80 lg:text-chartrons-warm-gray hover:text-white lg:hover:text-chartrons-bordeaux'
                    }`}
                  >
                    {lang.toUpperCase()}
                  </button>
                ))}
              </div>
              <Link
                to="/"
                className="hidden sm:inline-flex items-center justify-center min-h-[40px] px-3 rounded-xl text-xs font-semibold bg-white/10 lg:bg-chartrons-beige hover:bg-white/20 lg:hover:bg-chartrons-sand transition-colors"
              >
                {t('adminSpace.viewSite')}
              </Link>
              <button
                type="button"
                onClick={handleLogout}
                className="inline-flex items-center justify-center min-h-[40px] px-3 rounded-xl text-xs font-semibold bg-white/10 lg:bg-chartrons-beige hover:bg-white/20 lg:hover:bg-chartrons-sand transition-colors"
              >
                {t('adminSpace.logout')}
              </button>
            </div>
          </div>

          <nav
            className="lg:hidden flex gap-1.5 overflow-x-auto scrollbar-hide px-3 pb-3"
            aria-label={t('adminSpace.title')}
          >
            {NAV_ITEMS.map((item) => {
              const isActive = item.end
                ? location.pathname === item.to
                : location.pathname.startsWith(item.to);
              return (
                <NavLink
                  key={item.to}
                  to={item.to}
                  end={item.end}
                  className={`shrink-0 inline-flex items-center gap-1.5 px-3 py-2 rounded-full text-xs font-semibold min-h-[40px] transition-colors ${
                    isActive
                      ? 'bg-white text-chartrons-bordeaux shadow-sm'
                      : 'bg-white/10 text-white/90'
                  }`}
                >
                  <span aria-hidden>{item.icon}</span>
                  {t(`adminSpace.nav.${item.key}`)}
                </NavLink>
              );
            })}
          </nav>
        </header>

        <main className="flex-1 w-full max-w-7xl mx-auto px-4 py-5 sm:px-6 lg:px-10 lg:py-8 pb-[max(1.5rem,env(safe-area-inset-bottom))]">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
