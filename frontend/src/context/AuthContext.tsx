import { createContext, useEffect, useMemo, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';

import { authService } from '../services/authService';
import { storage } from '../utils/storage';

type AuthUser = {
  id: string;
  email: string;
  name: string;
  roles: string[];
};

type AuthContextType = {
  user: AuthUser | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (credentials: { email: string; password: string }) => Promise<void>;
  logout: () => void;
};

export const AuthContext = createContext<AuthContextType | undefined>(undefined);

const TOKEN_KEY = 'expert_raah_token';

type AuthProviderProps = {
  children: React.ReactNode;
};

export const AuthProvider = ({ children }: AuthProviderProps) => {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  useEffect(() => {
    const bootstrap = async () => {
      try {
        const token = storage.getToken(TOKEN_KEY);
        if (!token) {
          return;
        }
        const profile = await authService.getProfile();
        setUser(profile);
      } catch (error) {
        storage.clearToken(TOKEN_KEY);
        console.error('Failed to bootstrap auth state', error);
      } finally {
        setIsLoading(false);
      }
    };

    bootstrap();
  }, []);

  const login = async (credentials: { email: string; password: string }) => {
    setIsLoading(true);
    try {
      const { token, user: profile } = await authService.login(credentials);
      storage.setToken(TOKEN_KEY, token);
      setUser(profile);
      toast.success('Logged in successfully');
      navigate('/dashboard', { replace: true });
    } catch (error) {
      toast.error(authService.parseError(error));
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = () => {
    storage.clearToken(TOKEN_KEY);
    setUser(null);
    queryClient.clear();
    navigate('/login');
  };

  const value = useMemo(
    () => ({
      user,
      isAuthenticated: Boolean(user),
      isLoading,
      login,
      logout,
    }),
    [user, isLoading],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};




