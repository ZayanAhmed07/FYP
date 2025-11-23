import { AxiosError } from 'axios';

import { httpClient } from '../api/httpClient';
import { storage } from '../utils/storage';

const TOKEN_KEY = 'expert_raah_token';
const USER_KEY = 'expert_raah_user';

type ApiResponse<T> = {
  success: boolean;
  statusCode: number;
  message: string;
  data: T;
};

type AuthResponse = {
  token: string;
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
  const { data } = await httpClient.post<ApiResponse<AuthResponse>>('/auth/login', payload);
  
  // Store token and user data
  storage.setToken(TOKEN_KEY, data.data.token);
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
  const { data } = await httpClient.post<ApiResponse<AuthResponse>>('/auth/register', payload);
  
  // Store token and user data
  storage.setToken(TOKEN_KEY, data.data.token);
  localStorage.setItem(USER_KEY, JSON.stringify(data.data.user));
  
  return data.data;
};

const getProfile = async (): Promise<AuthResponse['user']> => {
  const { data } = await httpClient.get<ApiResponse<AuthResponse['user']>>('/users/me');
  return data.data;
};

const logout = () => {
  storage.clearToken(TOKEN_KEY);
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
  return storage.getToken(TOKEN_KEY);
};

const isAuthenticated = (): boolean => {
  const token = storage.getToken(TOKEN_KEY);
  return !!token;
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

