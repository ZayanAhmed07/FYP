const isBrowser = typeof window !== 'undefined';

const withGuard = <T,>(fn: () => T, fallback: T) => {
  try {
    return fn();
  } catch (error) {
    console.error('Storage error', error);
    return fallback;
  }
};

const getToken = (key: string) =>
  isBrowser ? withGuard(() => window.localStorage.getItem(key), null) : null;

const setToken = (key: string, value: string) => {
  if (!isBrowser) return;
  withGuard(() => window.localStorage.setItem(key, value), undefined);
};

const clearToken = (key: string) => {
  if (!isBrowser) return;
  withGuard(() => window.localStorage.removeItem(key), undefined);
};

export const storage = {
  getToken,
  setToken,
  clearToken,
};




