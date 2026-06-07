import { createContext, useEffect, useMemo, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';

import { authService } from '../services/authService';

type AuthUser = {
  id: string;
  email: string;
  name: string;
  roles: string[];
  accountType?: 'buyer' | 'consultant' | 'admin';
  profileImage?: string;
};

type AuthContextType = {
  user: AuthUser | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (credentials: { email: string; password: string }) => Promise<void>;
  logout: () => void;
};

export const AuthContext = createContext<AuthContextType | undefined>(undefined);

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
        // Token lives in an HttpOnly cookie — browser sends it automatically.
        // Just call getProfile(); a 401 means the session is gone.
        const profile = await authService.getProfile();
        setUser(profile);
        localStorage.setItem('expert_raah_user', JSON.stringify(profile));
      } catch (error: unknown) {
        const msg = error instanceof Error ? error.message : String(error);
        const isAuthError =
          msg.includes('401') || msg.includes('403') ||
          msg.includes('Unauthorized') || msg.includes('Forbidden');

        if (isAuthError) {
          localStorage.removeItem('expert_raah_user');
          setUser(null);
        } else {
          // Network / server error — fall back to cached user so the UI
          // doesn't force a logout on a temporary outage.
          const cached = localStorage.getItem('expert_raah_user');
          if (cached) {
            try {
              setUser(JSON.parse(cached));
            } catch {
              localStorage.removeItem('expert_raah_user');
            }
          }
        }
      } finally {
        setIsLoading(false);
      }
    };

    bootstrap();

    // Listen for storage changes (for OAuth callbacks and cross-tab logout)
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'expert_raah_user' && !e.newValue) {
        setUser(null);
      }
    };

    window.addEventListener('storage', handleStorageChange);

    // Listen for user data updates (e.g., from account type selection)
    const handleUserDataUpdate = (e: CustomEvent) => {
      setUser(e.detail);
      localStorage.setItem('expert_raah_user', JSON.stringify(e.detail));
    };

    // Listen for OAuth login events
    const handleOAuthLogin = (e: CustomEvent) => {
      setUser(e.detail);
    };

    window.addEventListener('userDataUpdated', handleUserDataUpdate as EventListener);
    window.addEventListener('oauthLogin', handleOAuthLogin as EventListener);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('userDataUpdated', handleUserDataUpdate as EventListener);
      window.removeEventListener('oauthLogin', handleOAuthLogin as EventListener);
    };
  }, []); // Remove navigate from dependencies to prevent loops

  // Separate useEffect for handling redirects based on user state
  useEffect(() => {
    if (isLoading || !user) return;

    const currentPath = window.location.pathname;

    // Don't redirect if on logout page
    if (currentPath === '/logout') return;

    // Handle users without account type
    if (!user.accountType) {
      const isOnAuthPage = currentPath === '/login' || currentPath === '/signup' || currentPath === '/';
      if (isOnAuthPage) {
        navigate('/account-type', { replace: true });
      }
      return;
    }

    // Only redirect if on auth pages (login/signup/home) and not already on correct dashboard
    const isOnAuthPage = currentPath === '/login' || currentPath === '/signup' || currentPath === '/';

    // Don't redirect from common pages that all users can access
    const commonPages = ['/messages', '/profile', '/notifications', '/consultant/', '/payment', '/withdrawal', '/post-job', '/submit-proposal'];
    const isOnCommonPage = commonPages.some(page => currentPath.startsWith(page));

    // Don't redirect from consultant profile pages (viewing profiles should be allowed for all)
    const isViewingConsultantProfile = /^\/consultant\/[a-zA-Z0-9]+$/.test(currentPath);

    const isOnWrongDashboard = (
      (user.accountType === 'consultant' && currentPath.startsWith('/buyer')) ||
      ((user.accountType === 'admin' || user.roles?.includes('admin')) &&
        (currentPath.startsWith('/buyer') || currentPath.startsWith('/consultant'))) ||
      (user.accountType === 'buyer' && (currentPath.startsWith('/consultant-dashboard') || currentPath.startsWith('/admin')))
    );

    if ((isOnAuthPage || isOnWrongDashboard) && !isOnCommonPage && !isViewingConsultantProfile) {
      if (user.accountType === 'consultant') {
        navigate('/consultant-dashboard', { replace: true });
      } else if (user.accountType === 'admin' || user.roles?.includes('admin')) {
        navigate('/admin', { replace: true });
      } else {
        navigate('/buyer-dashboard', { replace: true });
      }
    }
  }, [user, isLoading]); // Removed navigate to prevent infinite loops

  const login = async (credentials: { email: string; password: string }) => {
    setIsLoading(true);
    try {
      // Clear any previous user data before login
      setUser(null);
      localStorage.removeItem('expert_raah_user');

      const { user: profile } = await authService.login(credentials);
      localStorage.setItem('expert_raah_user', JSON.stringify(profile));

      // Get fresh profile data from backend to ensure consistency
      try {
        const freshProfile = await authService.getProfile();
        setUser(freshProfile);
        localStorage.setItem('expert_raah_user', JSON.stringify(freshProfile));

        toast.success('Logged in successfully');

        // Navigate based on user account type with delay to ensure state is updated
        setTimeout(() => {
          if (!freshProfile.accountType) {
            navigate('/account-type', { replace: true });
          } else if (freshProfile.accountType === 'consultant') {
            navigate('/consultant-dashboard', { replace: true });
          } else if (freshProfile.accountType === 'admin' || freshProfile.roles.includes('admin')) {
            navigate('/admin', { replace: true });
          } else {
            navigate('/buyer-dashboard', { replace: true });
          }
        }, 100);
      } catch (error) {
        // If getProfile fails, use login response data
        console.warn('Failed to refresh profile after login, using login data', error);
        setUser(profile);

        toast.success('Logged in successfully');

        setTimeout(() => {
          if (!profile.accountType) {
            navigate('/account-type', { replace: true });
          } else if (profile.accountType === 'consultant') {
            navigate('/consultant-dashboard', { replace: true });
          } else if (profile.accountType === 'admin' || profile.roles?.includes('admin')) {
            navigate('/admin', { replace: true });
          } else {
            navigate('/buyer-dashboard', { replace: true });
          }
        }, 100);
      }
    } catch (error) {
      toast.error(authService.parseError(error));
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = () => {
    localStorage.removeItem('expert_raah_user');
    localStorage.removeItem('expert_raah_user_last_update');
    setUser(null);
    queryClient.clear();
    navigate('/', { replace: true });
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





