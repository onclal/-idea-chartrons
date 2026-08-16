import { type FormEvent } from 'react';
import { useTranslation } from 'react-i18next';
import { Link, useNavigate } from 'react-router-dom';
import { useSearch } from '../context/SearchContext';
import { useAdmin } from '../context/AdminContext';
import { useFavorites } from '../context/FavoritesContext';
import { usePwa } from '../context/PwaContext';
import { CategoryTabs } from './CategoryTabs';
import { Badge } from './ui';

function SearchIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.4"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="w-5 h-5"
      aria-hidden
    >
      <circle cx="11" cy="11" r="7" />
      <path d="M20 20l-3.5-3.5" />
    </svg>
  );
}

export function Header() {
  const { t, i18n } = useTranslation();
  const { query, setQuery } = useSearch();
  const { isAdminMode } = useAdmin();
  const { favorites } = useFavorites();
  const { online } = usePwa();
  const navigate = useNavigate();

  const setLanguage = (lang: 'fr' | 'en') => {
    i18n.changeLanguage(lang);
  };

  const submitSearch = () => {
    const q = query.trim();
    if (!q) {
      navigate('/recherche');
      return;
    }
    navigate(`/recherche?q=${encodeURIComponent(q)}`);
  };

  const handleSearch = (event: FormEvent) => {
    event.preventDefault();
    submitSearch();
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

          <form onSubmit={handleSearch} className="flex items-stretch" role="search">
            <div className="flex flex-1 min-w-0 items-stretch rounded-2xl overflow-hidden bg-white shadow-sm focus-within:ring-2 focus-within:ring-white/50">
              <button
                type="button"
                onClick={submitSearch}
                className="cursor-pointer shrink-0 touch-target w-12 min-h-[48px] text-chartrons-olive-dark flex items-center justify-center hover:bg-chartrons-beige active:bg-chartrons-sand transition-colors"
                aria-label={t('search.submit')}
              >
                <SearchIcon />
              </button>
              <input
                type="search"
                inputMode="search"
                enterKeyHint="search"
                autoComplete="off"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={(event) => {
                  if (event.key === 'Enter') {
                    event.preventDefault();
                    submitSearch();
                  }
                }}
                placeholder={t('search.placeholder')}
                className="flex-1 min-w-0 py-3 pr-2 bg-transparent border-0 text-base text-chartrons-olive-dark placeholder:text-chartrons-warm-gray/60 focus:outline-none min-h-[48px]"
                aria-label={t('search.placeholder')}
              />
              {query && (
                <button
                  type="button"
                  onClick={() => setQuery('')}
                  className="cursor-pointer shrink-0 touch-target w-10 min-h-[48px] text-chartrons-warm-gray text-xs hover:text-chartrons-olive-dark"
                  aria-label={t('search.clear')}
                >
                  ✕
                </button>
              )}
              <button
                type="button"
                onClick={submitSearch}
                className="cursor-pointer shrink-0 touch-target min-h-[48px] px-3.5 bg-chartrons-green text-white text-xs font-bold hover:bg-chartrons-green-light active:scale-[0.98] transition-all inline-flex items-center justify-center gap-1.5"
              >
                <SearchIcon />
                <span>{t('search.submit')}</span>
              </button>
            </div>
          </form>

          <CategoryTabs />
        </div>
      </div>
      <div className="h-0.5 bg-gradient-to-r from-chartrons-brass/40 via-chartrons-beige to-chartrons-olive/30" />
    </header>
  );
}
