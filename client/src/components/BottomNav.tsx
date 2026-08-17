import { Link, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

const navItems = [
  { path: '/', icon: '🏠', key: 'home' },
  { path: '/posts', icon: '📋', key: 'posts' },
  { path: '/carte', icon: '🗺️', key: 'carte' },
  { path: '/decouvrir', icon: '🚶', key: 'decouvrir' },
  { path: '/acteurs', icon: '🏪', key: 'acteurs' },
  { path: '/carnet', icon: '📔', key: 'carnet' },
] as const;

export function BottomNav() {
  const { t } = useTranslation();
  const location = useLocation();

  return (
    <nav
      className="fixed bottom-0 inset-x-0 z-50 bg-white/95 backdrop-blur-xl border-t border-chartrons-beige shadow-nav safe-bottom"
      aria-label="Main navigation"
    >
      <div className="max-w-lg mx-auto flex justify-around items-stretch h-[4.5rem] px-1">
        {navItems.map(({ path, icon, key }) => {
          const isActive =
            path === '/'
              ? location.pathname === '/'
              : location.pathname === path || location.pathname.startsWith(`${path}/`);

          return (
            <Link
              key={path}
              to={path}
              className={`relative flex flex-1 flex-col items-center justify-center gap-0.5 py-1 rounded-2xl mx-0.5 transition-all duration-200 touch-target ${
                isActive
                  ? 'text-chartrons-bordeaux'
                  : 'text-chartrons-warm-gray active:bg-chartrons-beige/50'
              }`}
            >
              {isActive && (
                <span className="absolute top-1 left-1/2 -translate-x-1/2 w-8 h-1 rounded-full bg-chartrons-bordeaux" />
              )}
              <span className={`text-xl transition-transform ${isActive ? 'scale-110' : ''}`} aria-hidden>
                {icon}
              </span>
              <span
                className={`text-[10px] font-semibold leading-tight text-center px-0.5 ${
                  isActive ? 'text-chartrons-bordeaux' : ''
                }`}
              >
                {t(`nav.${key}`)}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
