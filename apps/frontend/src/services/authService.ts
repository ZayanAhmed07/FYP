import { AxiosError } from 'axios';

import { httpClient } from '../api/httpClient';

const USER_KEY = 'expert_raah_user';

type ApiResponse<T> = {
  success: boolean;
  statusCode: number;
  message: string;
  data: T;
};

type AuthResponse = {
  user: {
    id: string;
    email: string;
    name: string;
    roles: string[];
    accountType?: 'buyer' | 'consultant' | 'admin';
    isVerified?: boolean;
    profileImage?: string;
  };
};

const login = async (payload: { email: string; password: string }): Promise<AuthResponse> => {
  // Token is now set in HttpOnly cookie by backend
  const { data } = await httpClient.post<ApiResponse<AuthResponse>>('/auth/login', payload);
  
  // Store only user data (token is in HttpOnly cookie)
  localStorage.setItem(USER_KEY, JSON.stringify(data.data.user));
  
  return data.data;
};

const loginWithGoogle = () => {
  // Redirect to backend Google auth endpoint
  window.location.href = `${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/auth/google`;
};

const register = async (payload: { 
  name: string; 
  email: string; 
  password: string;
  accountType: 'buyer' | 'consultant';
}): Promise<AuthResponse> => {
  // Token is now set in HttpOnly cookie by backend
  const { data } = await httpClient.post<ApiResponse<AuthResponse>>('/auth/register', payload);
  
  // Store only user data (token is in HttpOnly cookie)
  localStorage.setItem(USER_KEY, JSON.stringify(data.data.user));
  
  return data.data;
};

const getProfile = async (): Promise<AuthResponse['user']> => {
  const { data } = await httpClient.get<ApiResponse<AuthResponse['user']>>('/users/me');
  return data.data;
};

const logout = async () => {
  // Call backend to clear HttpOnly cookie
  try {
    await httpClient.post('/auth/logout');
  } catch (error) {
    // Continue with local cleanup even if backend call fails
    console.error('Logout error:', error);
  }
  
  // Clear local storage
  localStorage.removeItem(USER_KEY);
};

const getCurrentUser = (): AuthResponse['user'] | null => {
  try {
    const userStr = localStorage.getItem(USER_KEY);
    return userStr ? JSON.parse(userStr) : null;
  } catch {
    return null;
  }
};

const getToken = (): string | null => {
  // Token is now in HttpOnly cookie, not accessible from JS
  return null;
};

const isAuthenticated = (): boolean => {
  // Check if user data exists (token is in HttpOnly cookie)
  const user = getCurrentUser();
  return !!user;
};

const parseError = (error: unknown) => {
  if (error instanceof AxiosError) {
    return error.response?.data?.message ?? error.message;
  }
  if (error instanceof Error) {
    return error.message;
  }
  return 'Something went wrong. Please try again.';
};

const forgotPassword = async (payload: { email: string }) => {
  const { data } = await httpClient.post('/auth/forgot-password', payload);
  return data.data;
};

const resetPassword = async (payload: { token: string; password: string }) => {
  const { data } = await httpClient.post('/auth/reset-password', payload);
  return data.data;
};

export const authService = {
  login,
  loginWithGoogle,
  register,
  getProfile,
  logout,
  getCurrentUser,
  getToken,
  isAuthenticated,
  parseError,
  forgotPassword,
  resetPassword,
};

