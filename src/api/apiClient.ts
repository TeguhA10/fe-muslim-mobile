import axios from 'axios';
import { Platform } from 'react-native';

const getBaseUrl = () => {
  const envUrl = process.env.EXPO_PUBLIC_API_BASE_URL;
  
  if (envUrl) {
    if (Platform.OS === 'android' && envUrl.includes('localhost')) {
      return envUrl.replace('localhost', '10.0.2.2');
    }
    if (Platform.OS === 'web' && envUrl.includes('10.0.2.2')) {
      return envUrl.replace('10.0.2.2', 'localhost');
    }
    return envUrl;
  }

  // Fallbacks
  if (Platform.OS === 'android') {
    return 'http://10.0.2.2:5000/api/v1';
  }

  return 'http://localhost:5000/api/v1';
};

export const apiClient = axios.create({
  baseURL: getBaseUrl(),
  timeout: 60000,
  headers: {
    'Content-Type': 'application/json',
  },
});

console.log('[apiClient] Initialized baseURL:', getBaseUrl());

// Auto-remove Content-Type header for FormData so React Native generates proper multipart boundary
apiClient.interceptors.request.use((config) => {
  console.log('[apiClient] Sending Request:', config.method?.toUpperCase(), (config.baseURL || '') + (config.url || ''));
  if (config.data && (config.data instanceof FormData || (config.data as any)._parts)) {
    delete config.headers['Content-Type'];
  }
  return config;
});

apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    console.log('[apiClient] Request Error:', error.message, '| Code:', error.code, '| URL:', (error.config?.baseURL || '') + (error.config?.url || ''));
    return Promise.reject(error);
  }
);

export const setAuthToken = (token: string | null) => {
  if (token) {
    apiClient.defaults.headers.common['Authorization'] = `Bearer ${token}`;
  } else {
    delete apiClient.defaults.headers.common['Authorization'];
  }
};

