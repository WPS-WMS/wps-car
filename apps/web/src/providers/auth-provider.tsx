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
import { useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import {
  clearAuthSession,
  getAccessToken,
  getStoredUser,
} from '@/lib/auth-storage';
import type { AuthUser, LoginResponse } from '@/types/api';

interface AuthContextValue {
  user: AuthUser | null;
  isLoading: boolean;
  login: (email: string, password: string, tenantCnpj?: string) => Promise<LoginResponse>;
  verifyTwoFactor: (twoFactorToken: string, code: string) => Promise<void>;
  logout: () => Promise<void>;
  isManager: boolean;
  isAdmin: boolean;
  isModerator: boolean;
}

const AuthContext = createContext<AuthContextValue | null>(null);

let sessionMeValidated = false;

function redirectAfterLogin(user: AuthUser, router: ReturnType<typeof useRouter>) {
  router.push(user.role === 'MODERATOR' ? '/plataforma' : '/dashboard');
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const token = getAccessToken();
    const stored = getStoredUser();
    if (!token) {
      setIsLoading(false);
      return;
    }
    if (stored) {
      setUser(stored);
    }
    if (sessionMeValidated) {
      setIsLoading(false);
      return;
    }
    sessionMeValidated = true;
    api
      .me()
      .then(setUser)
      .catch(() => {
        sessionMeValidated = false;
        clearAuthSession();
        setUser(null);
      })
      .finally(() => setIsLoading(false));
  }, []);

  const login = useCallback(
    async (email: string, password: string, tenantCnpj?: string) => {
      queryClient.clear();
      sessionMeValidated = true;
      const data = await api.login({ email, password, tenantCnpj });

      if (data.requiresTwoFactor) {
        return data;
      }

      if (data.user) {
        setUser(data.user);
        redirectAfterLogin(data.user, router);
      }

      return data;
    },
    [queryClient, router],
  );

  const verifyTwoFactor = useCallback(
    async (twoFactorToken: string, code: string) => {
      const data = await api.verifyTwoFactor({ twoFactorToken, code });
      if (data.user) {
        setUser(data.user);
        redirectAfterLogin(data.user, router);
      }
    },
    [router],
  );

  const logout = useCallback(async () => {
    await api.logout();
    queryClient.clear();
    sessionMeValidated = false;
    setUser(null);
    router.push('/login');
  }, [queryClient, router]);

  const value = useMemo(
    () => ({
      user,
      isLoading,
      login,
      verifyTwoFactor,
      logout,
      isManager: user?.role === 'ADMIN' || user?.role === 'MANAGER',
      isAdmin: user?.role === 'ADMIN',
      isModerator: user?.role === 'MODERATOR',
    }),
    [user, isLoading, login, verifyTwoFactor, logout],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
