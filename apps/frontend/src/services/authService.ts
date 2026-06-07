import { AxiosError } from 'axios';

import { httpClient } from '../api/httpClient';
import { env } from '../config/env';

const USER_KEY = 'expert_raah_user';
const TOKEN_KEY = 'expert_raah_token';

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
  token?: string;
};

const saveToken = (token: string | undefined) => {
  if (token) sessionStorage.setItem(TOKEN_KEY, token);
};

const clearToken = () => sessionStorage.removeItem(TOKEN_KEY);

const getToken = (): string | null => sessionStorage.getItem(TOKEN_KEY);

const login = async (payload: { email: string; password: string }): Promise<AuthResponse> => {
  const { data } = await httpClient.post<ApiResponse<AuthResponse>>('/auth/login', payload);
  saveToken(data.data.token);
  localStorage.setItem(USER_KEY, JSON.stringify(data.data.user));
  return data.data;
};

const loginWithGoogle = () => {
  window.location.href = `${env.apiBaseUrl.replace('/api', '')}/api/auth/google`;
};

const register = async (payload: {
  name: string;
  email: string;
  password: string;
  accountType: 'buyer' | 'consultant';
}): Promise<AuthResponse> => {
  const { data } = await httpClient.post<ApiResponse<AuthResponse>>('/auth/register', payload);
  saveToken(data.data.token);
  localStorage.setItem(USER_KEY, JSON.stringify(data.data.user));
  return data.data;
};

const getProfile = async (): Promise<AuthResponse['user']> => {
  const { data } = await httpClient.get<ApiResponse<AuthResponse['user']>>('/users/me');
  return data.data;
};

const logout = async () => {
  try {
    await httpClient.post('/auth/logout');
  } catch (error) {
    console.error('Logout error:', error);
  }
  clearToken();
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

const isAuthenticated = (): boolean => !!getCurrentUser();

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
