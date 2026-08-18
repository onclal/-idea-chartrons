import { matchesSearchQuery } from '@idea-chartrons/shared';
import { createContext, useContext, useState, type ReactNode } from 'react';

export type SearchMode = 'ai' | 'directory';

interface SearchContextValue {
  query: string;
  setQuery: (query: string) => void;
  mode: SearchMode;
  setMode: (mode: SearchMode) => void;
}

const SearchContext = createContext<SearchContextValue | null>(null);

export function SearchProvider({ children }: { children: ReactNode }) {
  const [query, setQuery] = useState('');
  const [mode, setMode] = useState<SearchMode>('directory');
  return (
    <SearchContext.Provider value={{ query, setQuery, mode, setMode }}>
      {children}
    </SearchContext.Provider>
  );
}

export function useSearch() {
  const ctx = useContext(SearchContext);
  if (!ctx) throw new Error('useSearch must be used within SearchProvider');
  return ctx;
}

export function matchesSearch(text: string, query: string) {
  return matchesSearchQuery(text, query);
}
