import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { useSearch } from '../context/SearchContext';
import { CategoryTabs } from './CategoryTabs';

export function Header() {
  const { t, i18n } = useTranslation();
  const { query, setQuery } = useSearch();

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
            <div className="flex items-center gap-1 shrink-0 bg-white/10 rounded-xl p-0.5" role="group" aria-label={t('common.language')}>
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

          <div className="relative">
            <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-chartrons-warm-gray text-sm pointer-events-none" aria-hidden>
              🔍
            </span>
            <input
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={t('search.placeholder')}
              className="w-full pl-10 pr-10 py-3 rounded-2xl bg-white/95 border-0 text-base text-chartrons-olive-dark placeholder:text-chartrons-warm-gray/60 focus:outline-none focus:ring-2 focus:ring-white/50 shadow-sm min-h-[48px]"
            />
            {query && (
              <button
                onClick={() => setQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 touch-target w-8 h-8 rounded-full bg-chartrons-beige flex items-center justify-center text-chartrons-warm-gray text-xs hover:bg-chartrons-sand"
                aria-label={t('search.clear')}
              >
                ✕
              </button>
            )}
          </div>

          <CategoryTabs />
        </div>
      </div>
      <div className="h-0.5 bg-gradient-to-r from-chartrons-brass/40 via-chartrons-beige to-chartrons-olive/30" />
    </header>
  );
}
