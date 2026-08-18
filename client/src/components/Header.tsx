import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { useAdmin } from '../context/AdminContext';
import { useFavorites } from '../context/FavoritesContext';
import { usePwa } from '../context/PwaContext';
import { useConfort } from '../context/ConfortContext';
import { CategoryTabs } from './CategoryTabs';
import { HeroSearch } from './HeroSearch';
import { Badge } from './ui';

export function Header() {
  const { t, i18n } = useTranslation();
  const { isAdminMode } = useAdmin();
  const { favorites } = useFavorites();
  const { online } = usePwa();
  const { isConfortMode, toggleConfortMode } = useConfort();

  const setLanguage = (lang: 'fr' | 'en') => {
    i18n.changeLanguage(lang);
  };

  return (
    <header className="sticky top-0 z-40 safe-top shadow-md">
      <div className="bg-gradient-to-br from-chartrons-bordeaux via-chartrons-bordeaux to-chartrons-brick">
        <div className="max-w-lg mx-auto px-4 pt-3 pb-3 space-y-3">
          <div className="flex items-center justify-between gap-3">
            <Link to="/" className="min-w-0 group">
              <h1 className="text-lg font-bold tracking-tight truncate text-white">
                {t('app.name')}
              </h1>
              <p className="text-[10px] text-white/65 truncate">{t('app.subtitle')}</p>
            </Link>
            <div className="flex items-center gap-2 shrink-0">
              {isAdminMode && (
                <>
                  <Link
                    to="/admin"
                    className="touch-target hidden sm:inline-flex items-center px-3 py-1.5 rounded-xl bg-white/15 text-white text-xs font-semibold hover:bg-white/25 transition-colors"
                  >
                    {t('admin.openDashboard')}
                  </Link>
                  <Badge variant="brass" icon="🛡️" className="hidden sm:inline-flex">
                    {t('admin.badge')}
                  </Badge>
                </>
              )}
              {!online && (
                <span className="px-2 py-1 rounded-lg bg-chartrons-brass text-chartrons-olive-dark text-[10px] font-bold">
                  {t('pwa.offlineBadge')}
                </span>
              )}
              <Link
                to="/favoris"
                className="relative touch-target w-10 h-10 rounded-xl bg-white/10 text-white flex items-center justify-center hover:bg-white/20 transition-colors"
                aria-label={t('favorites.title')}
              >
                ♥
                {favorites.length > 0 && (
                  <span className="absolute -top-1 -right-1 min-w-[1.1rem] h-[1.1rem] px-1 rounded-full bg-white text-chartrons-bordeaux text-[10px] font-bold flex items-center justify-center">
                    {favorites.length}
                  </span>
                )}
              </Link>
              <div className="flex items-center gap-1 bg-white/10 rounded-xl p-0.5" role="group" aria-label={t('common.language')}>
              {(['fr', 'en'] as const).map((lang) => (
                <button
                  key={lang}
                  onClick={() => setLanguage(lang)}
                  className={`touch-target px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                    i18n.language === lang
                      ? 'bg-white text-chartrons-bordeaux shadow-sm'
                      : 'text-white/80 hover:text-white'
                  }`}
                >
                  {lang.toUpperCase()}
                </button>
              ))}
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={toggleConfortMode}
            aria-pressed={isConfortMode}
            aria-label={isConfortMode ? t('confort.toggleAriaOn') : t('confort.toggleAria')}
            className={`w-full min-h-[60px] px-4 rounded-2xl text-base font-bold touch-target ${
              isConfortMode
                ? 'bg-[#ffe14d] text-black border-2 border-black'
                : 'bg-white text-chartrons-bordeaux'
            }`}
          >
            {isConfortMode ? t('confort.toggleOn') : t('confort.toggle')}
          </button>

          {!isConfortMode && (
            <>
              <HeroSearch variant="header" />
              <CategoryTabs />
            </>
          )}
        </div>
      </div>
      <div className="h-0.5 bg-gradient-to-r from-chartrons-brass/40 via-chartrons-beige to-chartrons-olive/30" />
    </header>
  );
}
