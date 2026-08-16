import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from 'react';
import { DEMO_USER_IDS, UserRole, type User } from '@idea-chartrons/shared';
import { api } from '../lib/api';

const AUTH_STORAGE_KEY = 'idea-chartrons-current-user';
const DEFAULT_USER_ID = DEMO_USER_IDS[0];

interface AuthContextValue {
  currentUser: User | null;
  currentUserId: string;
  demoUsers: User[];
  loading: boolean;
  switchUser: (userId: string) => void;
  refreshUser: () => Promise<void>;
  isRelaisStaff: boolean;
  isMerchant: boolean;
}

const AuthContext = createContext<AuthContextValue | null>(null);

function loadStoredUserId(): string {
  return localStorage.getItem(AUTH_STORAGE_KEY) ?? DEFAULT_USER_ID;
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [currentUserId, setCurrentUserId] = useState(loadStoredUserId);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [demoUsers, setDemoUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);

  const refreshUser = useCallback(async () => {
    const [user, users] = await Promise.all([
      api.getUser(currentUserId),
      api.getUsers(),
    ]);
    setCurrentUser(user);
    setDemoUsers(users.filter((u) => (DEMO_USER_IDS as readonly string[]).includes(u.id)));
  }, [currentUserId]);

  useEffect(() => {
    setLoading(true);
    refreshUser()
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [refreshUser]);

  const switchUser = useCallback((userId: string) => {
    localStorage.setItem(AUTH_STORAGE_KEY, userId);
    setCurrentUserId(userId);
  }, []);

  const isRelaisStaff =
    currentUser?.role === UserRole.BenevolRelais || currentUser?.role === UserRole.Admin;
  const isMerchant = currentUser?.role === UserRole.Commercant;

  return (
    <AuthContext.Provider
      value={{
        currentUser,
        currentUserId,
        demoUsers,
        loading,
        switchUser,
        refreshUser,
        isRelaisStaff,
        isMerchant,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
