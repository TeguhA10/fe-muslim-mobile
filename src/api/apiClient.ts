import axios from 'axios';
import { Platform } from 'react-native';
import { secureStorage } from '../utils/secureStorage';
import { ENDPOINTS } from './endpoints';
import { useAuthStore } from '../store/useAuthStore';

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
  async (error) => {
    const originalRequest = error.config;
    console.log('[apiClient] Request Error:', error.message, '| Code:', error.code, '| URL:', (originalRequest?.baseURL || '') + (originalRequest?.url || ''));

    // Handle 401 Unauthorized with Automatic Refresh Token retry
    if (error.response?.status === 401 && originalRequest && !originalRequest._retry && !originalRequest.url?.includes(ENDPOINTS.AUTH.LOGIN) && !originalRequest.url?.includes(ENDPOINTS.AUTH.REFRESH_TOKEN)) {
      originalRequest._retry = true;
      try {
        const storedRefreshToken = await secureStorage.getItem('auth_refresh_token');
        if (storedRefreshToken) {
          console.log('[apiClient] Attempting token refresh via /auth/refresh-token...');
          const refreshRes = await axios.post(`${getBaseUrl()}${ENDPOINTS.AUTH.REFRESH_TOKEN}`, {
            refreshToken: storedRefreshToken,
          });

          const newAccessToken = refreshRes.data?.data?.token;
          const newRefreshToken = refreshRes.data?.data?.refreshToken || storedRefreshToken;

          if (newAccessToken) {
            setAuthToken(newAccessToken);
            useAuthStore.getState().setTokens(newAccessToken, newRefreshToken);
            originalRequest.headers['Authorization'] = `Bearer ${newAccessToken}`;
            console.log('[apiClient] Token refresh successful. Retrying original request.');
            return apiClient(originalRequest);
          }
        }
      } catch (refreshErr) {
        console.log('[apiClient] Refresh token failed or expired. Invalidating session.');
        useAuthStore.getState().logout();
      }
    }

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

