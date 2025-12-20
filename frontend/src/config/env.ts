const getEnv = (key: string, fallback?: string) => {
  const value = import.meta.env[key as keyof ImportMetaEnv] as string | undefined;
  if (value === undefined || value === '') {
    if (fallback !== undefined) return fallback;
    throw new Error(`Missing environment variable: ${key}`);
  }
  return value;
};

export const env = {
  apiBaseUrl: getEnv('VITE_API_BASE_URL', 'http://localhost:5000/api'),
};





