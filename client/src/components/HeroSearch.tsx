import { type FormEvent } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { useConciergePanel } from '../context/ConciergePanelContext';
import { useSearch, type SearchMode } from '../context/SearchContext';
import { ConciergeBeretLoader } from './ConciergeBeretLoader';

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

interface HeroSearchProps {
  variant: 'hero' | 'header';
}

export function HeroSearch({ variant }: HeroSearchProps) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { query, setQuery, mode, setMode } = useSearch();
  const { ask, pending } = useConciergePanel();
  const hero = variant === 'hero';

  const submitDirectory = () => {
    const q = query.trim();
    if (!q) {
      navigate('/recherche');
      return;
    }
    navigate(`/recherche?q=${encodeURIComponent(q)}`);
  };

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault();
    const q = query.trim();
    if (mode === 'ai') {
      if (!q || pending) return;
      void ask(q);
      return;
    }
    submitDirectory();
  };

  const switchMode = (next: SearchMode) => {
    setMode(next);
  };

  const placeholder =
    mode === 'ai' ? t('search.placeholderAi') : t('search.placeholder');

  return (
    <div className={hero ? 'space-y-3' : 'space-y-2'}>
      <div
        className={`grid grid-cols-2 gap-1 p-1 rounded-2xl ${
          hero ? 'bg-chartrons-beige/80 border border-chartrons-beige' : 'bg-white/12'
        }`}
        role="tablist"
        aria-label={t('search.modeLabel')}
      >
        {([
          { id: 'ai' as const, icon: '🤖', label: t('search.modeAi'), hint: t('search.modeAiHint') },
          { id: 'directory' as const, icon: '🔍', label: t('search.modeDirectory'), hint: t('search.modeDirectoryHint') },
        ]).map((tab) => {
          const active = mode === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              role="tab"
              aria-selected={active}
              onClick={() => switchMode(tab.id)}
              className={`min-h-[44px] px-2 py-2 rounded-xl text-left transition-all ${
                active
                  ? hero
                    ? 'bg-chartrons-green text-white shadow-card'
                    : 'bg-white text-chartrons-bordeaux shadow-sm'
                  : hero
                    ? 'text-chartrons-olive-dark hover:bg-white/70'
                    : 'text-white/85 hover:bg-white/10'
              }`}
            >
              <span className={`block font-semibold leading-tight ${hero ? 'text-sm' : 'text-[11px]'}`}>
                <span aria-hidden className="mr-1">
                  {tab.icon}
                </span>
                {tab.label}
              </span>
              {hero && (
                <span className={`block text-[11px] mt-0.5 leading-snug ${active ? 'text-white/80' : 'text-chartrons-warm-gray'}`}>
                  {tab.hint}
                </span>
              )}
            </button>
          );
        })}
      </div>

      <form onSubmit={handleSubmit} className="flex items-stretch" role="search">
        <div
          className={`flex flex-1 min-w-0 items-stretch overflow-hidden bg-white shadow-sm focus-within:ring-2 ${
            hero
              ? 'rounded-3xl border border-chartrons-beige focus-within:ring-chartrons-green/30 min-h-[56px]'
              : 'rounded-2xl focus-within:ring-white/50'
          }`}
        >
          <span className="shrink-0 w-12 min-h-[48px] text-chartrons-olive-dark flex items-center justify-center">
            {mode === 'ai' && pending ? (
              <ConciergeBeretLoader size="sm" />
            ) : (
              <SearchIcon />
            )}
          </span>
          <input
            type="search"
            inputMode="search"
            enterKeyHint="search"
            autoComplete="off"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={placeholder}
            className={`flex-1 min-w-0 pr-2 bg-transparent border-0 text-chartrons-olive-dark placeholder:text-chartrons-warm-gray/60 focus:outline-none ${
              hero ? 'text-base py-4 min-h-[56px]' : 'text-base py-3 min-h-[48px]'
            }`}
            aria-label={placeholder}
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
            type="submit"
            disabled={mode === 'ai' && pending}
            className={`cursor-pointer shrink-0 touch-target px-3.5 text-xs font-bold inline-flex items-center justify-center gap-1.5 active:scale-[0.98] transition-all disabled:opacity-60 ${
              hero
                ? 'min-h-[56px] bg-chartrons-green text-white hover:bg-chartrons-green-light'
                : 'min-h-[48px] bg-chartrons-green text-white hover:bg-chartrons-green-light'
            }`}
          >
            {mode === 'ai' ? t('search.askAi') : t('search.submit')}
          </button>
        </div>
      </form>
    </div>
  );
}
