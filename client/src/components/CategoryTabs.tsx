import { Link, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

const categories = [
  { path: '/posts', key: 'posts' },
  { path: '/relais', key: 'relais' },
  { path: '/acteurs', key: 'acteurs' },
  { path: '/carte', key: 'carte' },
  { path: '/tourisme', key: 'tourisme' },
  { path: '/events', key: 'events' },
  { path: '/faq', key: 'faq' },
] as const;

export function CategoryTabs() {
  const { t } = useTranslation();
  const location = useLocation();

  return (
    <nav className="flex gap-1.5 overflow-x-auto scrollbar-hide pb-0.5 -mx-1 px-1" aria-label="Categories">
      {categories.map(({ path, key }) => {
        const isActive = location.pathname === path || location.pathname.startsWith(`${path}/`);
        return (
          <Link
            key={path}
            to={path}
            className={`shrink-0 px-3.5 py-2 rounded-xl text-xs font-semibold transition-all whitespace-nowrap touch-target ${
              isActive
                ? 'bg-white text-chartrons-bordeaux shadow-sm'
                : 'text-white/85 hover:text-white hover:bg-white/15'
            }`}
          >
            {t(`categories.${key}`)}
          </Link>
        );
      })}
    </nav>
  );
}
