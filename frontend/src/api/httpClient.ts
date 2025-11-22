import axios from 'axios';

import { env } from '../config/env';
import { storage } from '../utils/storage';

const TOKEN_KEY = 'expert_raah_token';

export const httpClient = axios.create({
  baseURL: env.apiBaseUrl,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

httpClient.interceptors.request.use((config) => {
  const token = storage.getToken(TOKEN_KEY);
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

httpClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      storage.clearToken(TOKEN_KEY);
      window.location.assign('/login');
    }
    return Promise.reject(error);
  },
);




