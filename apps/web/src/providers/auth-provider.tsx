'use client';

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import {
  clearAuthSession,
  getAccessToken,
  getStoredUser,
} from '@/lib/auth-storage';
import type { AuthUser } from '@/types/api';

interface AuthContextValue {
  user: AuthUser | null;
  isLoading: boolean;
  login: (email: string, password: string, tenantCnpj?: string) => Promise<void>;
  logout: () => Promise<void>;
  isManager: boolean;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const token = getAccessToken();
    const stored = getStoredUser();
    if (token && stored) {
      setUser(stored);
      api.me().then(setUser).catch(() => {
        clearAuthSession();
        setUser(null);
      });
    }
    setIsLoading(false);
  }, []);

  const login = useCallback(
    async (email: string, password: string, tenantCnpj?: string) => {
      const data = await api.login({ email, password, tenantCnpj });
      setUser(data.user);
      router.push('/dashboard');
    },
    [router],
  );

  const logout = useCallback(async () => {
    await api.logout();
    setUser(null);
    router.push('/login');
  }, [router]);

  const value = useMemo(
    () => ({
      user,
      isLoading,
      login,
      logout,
      isManager: user?.role === 'ADMIN' || user?.role === 'MANAGER',
    }),
    [user, isLoading, login, logout],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
