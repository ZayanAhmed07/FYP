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
        try {
          const profile = await authService.getProfile();
          setUser(profile);
          
          // Update localStorage with fresh data
          localStorage.setItem('expert_raah_user', JSON.stringify(profile));
          
          // Handle redirection for authenticated users
          if (!profile.accountType) {
            // Only redirect to account-type if on auth pages
            const currentPath = window.location.pathname;
            const isOnAuthPage = currentPath === '/login' || currentPath === '/signup' || currentPath === '/';
            if (isOnAuthPage) {
              navigate('/account-type', { replace: true });
            }
            return;
          }
          
          // Only redirect if on auth pages (login/signup/home) and not already on correct dashboard
          const currentPath = window.location.pathname;
          const isOnAuthPage = currentPath === '/login' || currentPath === '/signup' || currentPath === '/';
          
          // Don't redirect from common pages that all users can access
          const commonPages = ['/messages', '/profile', '/settings', '/notifications'];
          const isOnCommonPage = commonPages.some(page => currentPath.startsWith(page));
          
          const isOnWrongDashboard = (
            (profile.accountType === 'consultant' && currentPath.startsWith('/buyer')) ||
            ((profile.accountType === 'admin' || profile.roles?.includes('admin')) && 
             (currentPath.startsWith('/buyer') || currentPath.startsWith('/consultant'))) ||
            (profile.accountType === 'buyer' && (currentPath.startsWith('/consultant') || currentPath.startsWith('/admin')))
          );
          
          if ((isOnAuthPage || isOnWrongDashboard) && !isOnCommonPage) {
            if (profile.accountType === 'consultant') {
              navigate('/consultant-dashboard', { replace: true });
            } else if (profile.accountType === 'admin' || profile.roles?.includes('admin')) {
              navigate('/admin', { replace: true });
            } else {
              navigate('/buyer-dashboard', { replace: true });
            }
          }
        } catch (profileError) {
          // Only use cached data as last resort for network errors, not for auth errors
          if (!(profileError instanceof Error) || 
              (!profileError.message.includes('401') && !profileError.message.includes('403') && 
               !profileError.message.includes('Unauthorized') && !profileError.message.includes('Forbidden'))) {
            const cachedUser = localStorage.getItem('expert_raah_user');
            if (cachedUser) {
              try {
                const parsedUser = JSON.parse(cachedUser);
                setUser(parsedUser);
                console.warn('Using cached user data due to network error', profileError);
              } catch (parseError) {
                localStorage.removeItem('expert_raah_user');
              }
            }
          }
          throw profileError;
        }
      } catch (error) {
        // Only clear token for authentication errors (401/403), not for network errors
        if (error instanceof Error && 
            (error.message.includes('401') || error.message.includes('403') || 
             error.message.includes('Unauthorized') || error.message.includes('Forbidden'))) {
          storage.clearToken(TOKEN_KEY);
          localStorage.removeItem('expert_raah_user');
          setUser(null);
        }
        console.error('Failed to bootstrap auth state', error);
      } finally {
        setIsLoading(false);
      }
    };

    bootstrap();

    // Listen for storage changes (for OAuth callbacks) - always bootstrap on token change
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === TOKEN_KEY && e.newValue) {
        // Always bootstrap when token changes to ensure state is updated
        bootstrap();
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
  }, [navigate]); // Add navigate to dependency array

  const login = async (credentials: { email: string; password: string }) => {
    setIsLoading(true);
    try {
      // Clear any previous user data before login
      setUser(null);
      localStorage.removeItem('expert_raah_user');
      
      const { token, user: profile } = await authService.login(credentials);
      storage.setToken(TOKEN_KEY, token);
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
    storage.clearToken(TOKEN_KEY);
    localStorage.removeItem('expert_raah_user');
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




