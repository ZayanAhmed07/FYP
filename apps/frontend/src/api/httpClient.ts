import axios from 'axios';

import { env } from '../config/env';

export const httpClient = axios.create({
  baseURL: env.apiBaseUrl,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true, // Enable sending cookies with requests
});

httpClient.interceptors.request.use((config) => {
  const token = sessionStorage.getItem('expert_raah_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

httpClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Only redirect to login if we're not already on a public page
      const currentPath = window.location.pathname;
      const publicPaths = ['/login', '/signup', '/consultant/', '/reset-password', '/verify-identity'];
      const isPublicPath = publicPaths.some(path => currentPath.startsWith(path));
      
      if (!isPublicPath) {
        localStorage.removeItem('expert_raah_user');
        sessionStorage.removeItem('expert_raah_token');
        window.location.assign('/login');
      }
    }
    return Promise.reject(error);
  },
);





