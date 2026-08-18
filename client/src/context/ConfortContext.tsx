import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';

const CONFORT_STORAGE_KEY = 'idea-chartrons-confort-mode';

interface ConfortContextValue {
  isConfortMode: boolean;
  setConfortMode: (value: boolean) => void;
  toggleConfortMode: () => void;
}

const ConfortContext = createContext<ConfortContextValue | null>(null);

function readStoredConfort(): boolean {
  try {
    return localStorage.getItem(CONFORT_STORAGE_KEY) === '1';
  } catch {
    return false;
  }
}

export function ConfortProvider({ children }: { children: ReactNode }) {
  const [isConfortMode, setIsConfortMode] = useState(readStoredConfort);

  useEffect(() => {
    document.documentElement.classList.toggle('confort-mode', isConfortMode);
    document.documentElement.dataset.confort = isConfortMode ? 'on' : 'off';
    try {
      localStorage.setItem(CONFORT_STORAGE_KEY, isConfortMode ? '1' : '0');
    } catch {
      // private mode
    }
    return () => {
      document.documentElement.classList.remove('confort-mode');
      delete document.documentElement.dataset.confort;
    };
  }, [isConfortMode]);

  const setConfortMode = useCallback((value: boolean) => setIsConfortMode(value), []);
  const toggleConfortMode = useCallback(() => setIsConfortMode((current) => !current), []);

  const value = useMemo(
    () => ({ isConfortMode, setConfortMode, toggleConfortMode }),
    [isConfortMode, setConfortMode, toggleConfortMode],
  );

  return <ConfortContext.Provider value={value}>{children}</ConfortContext.Provider>;
}

export function useConfort() {
  const ctx = useContext(ConfortContext);
  if (!ctx) throw new Error('useConfort must be used within ConfortProvider');
  return ctx;
}
