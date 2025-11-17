import React, {
  ReactNode,
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  useEffect,
} from 'react';
import { authApi } from '../api/authApi';
import { AuthUser } from '../api/types';

type AuthStatus = 'loading' | 'authenticated' | 'unauthenticated';

interface AuthContextValue {
  status: AuthStatus;
  user?: AuthUser;
  login: () => Promise<void>;
  logout: () => Promise<void>;
  refresh: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [status, setStatus] = useState<AuthStatus>('loading');
  const [user, setUser] = useState<AuthUser | undefined>(undefined);

  const refresh = useCallback(async () => {
    try {
      const response = await authApi.getStatus();
      if (response.authenticated) {
        setUser(response.user);
        setStatus('authenticated');
      } else {
        setUser(undefined);
        setStatus('unauthenticated');
      }
    } catch (error) {
      console.error('Failed to fetch auth status', error);
      setUser(undefined);
      setStatus('unauthenticated');
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const login = useCallback(async () => {
    try {
      const url = await authApi.getLoginUrl();
      window.location.href = url;
    } catch (error) {
      console.error('Unable to start login flow. Falling back to backend endpoint.', error);
      try {
        window.location.href = authApi.getBackendLoginEndpoint();
      } catch (fallbackError) {
        console.error('Backend login endpoint is unavailable.', fallbackError);
      }
    }
  }, []);

  const logout = useCallback(async () => {
    try {
      await authApi.logout();
    } catch (error) {
      console.error('Failed to log out', error);
    } finally {
      await refresh();
    }
  }, [refresh]);

  const value = useMemo(
    () => ({
      status,
      user,
      login,
      logout,
      refresh,
    }),
    [status, user, login, logout, refresh],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = (): AuthContextValue => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
