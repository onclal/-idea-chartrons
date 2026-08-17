import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from 'react';
import { ADMIN_PASSCODE, ADMIN_SESSION_KEY } from '../config/admin';

interface AdminContextValue {
  isAdminMode: boolean;
  login: (password: string) => boolean;
  logout: () => void;
}

const AdminContext = createContext<AdminContextValue | null>(null);

function readSession(): boolean {
  return sessionStorage.getItem(ADMIN_SESSION_KEY) === '1';
}

export function AdminProvider({ children }: { children: ReactNode }) {
  const [isAdminMode, setIsAdminMode] = useState(readSession);

  useEffect(() => {
    sessionStorage.setItem(ADMIN_SESSION_KEY, isAdminMode ? '1' : '0');
  }, [isAdminMode]);

  const login = useCallback((password: string) => {
    if (password.trim() !== ADMIN_PASSCODE) return false;
    setIsAdminMode(true);
    return true;
  }, []);

  const logout = useCallback(() => {
    setIsAdminMode(false);
  }, []);

  return (
    <AdminContext.Provider value={{ isAdminMode, login, logout }}>
      {children}
    </AdminContext.Provider>
  );
}

export function useAdmin() {
  const ctx = useContext(AdminContext);
  if (!ctx) throw new Error('useAdmin must be used within AdminProvider');
  return ctx;
}
