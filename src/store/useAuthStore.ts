import { create } from 'zustand';
import { User } from '../types';
import { apiClient, setAuthToken } from '../api/apiClient';
import { ENDPOINTS } from '../api/endpoints';
import { secureStorage } from '../utils/secureStorage';
import { socketService } from '../services/socket.service';
import { useNotificationStore } from './useNotificationStore';

const AUTH_STORAGE_KEYS = {
  accessToken: 'auth_access_token',
  refreshToken: 'auth_refresh_token',
  user: 'auth_user',
} as const;

interface AuthState {
  user: User | null;
  token: string | null;
  refreshToken: string | null;
  isAuthenticated: boolean;
  isGuest: boolean;
  // When true, RootNavigator will transition to Register screen
  pendingRegisterRedirect: boolean;
  login: (user: User, token: string, refreshToken?: string | null) => Promise<void>;
  setTokens: (token: string, refreshToken?: string | null) => Promise<void>;
  setUser: (user: User | null) => Promise<void>;
  continueAsGuest: () => void;
  logout: () => Promise<void>;
  requestRegister: () => void;
  clearRegisterRedirect: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  token: null,
  refreshToken: null,
  isAuthenticated: false,
  isGuest: false,
  pendingRegisterRedirect: false,
  login: async (user, token, refreshToken = null) => {
    setAuthToken(token);
    const existingRefreshToken = useAuthStore.getState().refreshToken;
    const finalRefreshToken = refreshToken || existingRefreshToken;
    set({ user, token, refreshToken: finalRefreshToken, isAuthenticated: true, isGuest: false, pendingRegisterRedirect: false });
    try {
      await secureStorage.setItem(AUTH_STORAGE_KEYS.accessToken, token);
      if (refreshToken) {
        await secureStorage.setItem(AUTH_STORAGE_KEYS.refreshToken, refreshToken);
      }
      await secureStorage.setItem(AUTH_STORAGE_KEYS.user, JSON.stringify(user));
    } catch { }
  },
  setTokens: async (token, refreshToken = null) => {
    setAuthToken(token);
    const existingRefreshToken = useAuthStore.getState().refreshToken;
    const finalRefreshToken = refreshToken || existingRefreshToken;
    set({ token, refreshToken: finalRefreshToken, isAuthenticated: true, isGuest: false });
    try {
      await secureStorage.setItem(AUTH_STORAGE_KEYS.accessToken, token);
      if (refreshToken) {
        await secureStorage.setItem(AUTH_STORAGE_KEYS.refreshToken, refreshToken);
      }
    } catch { }
  },
  setUser: async (user) => {
    set({ user });
    try {
      if (user) await secureStorage.setItem(AUTH_STORAGE_KEYS.user, JSON.stringify(user));
      else await secureStorage.removeItem(AUTH_STORAGE_KEYS.user);
    } catch { }
  },
  continueAsGuest: () => {
    set({ isGuest: true, pendingRegisterRedirect: false });
  },
  logout: async () => {
    // 1. Disconnect Socket.IO session immediately
    socketService.disconnect();

    // 2. Clear in-app notification state
    useNotificationStore.setState({
      notifications: [],
      unreadCount: 0,
      total: 0,
      hasMore: false,
    });

    // 3. Clear auth store and headers immediately
    setAuthToken(null);
    set({
      user: null,
      token: null,
      refreshToken: null,
      isAuthenticated: false,
      isGuest: false,
      pendingRegisterRedirect: false,
    });

    // 4. Call backend API to invalidate token (best effort)
    try {
      await apiClient.post(ENDPOINTS.AUTH.LOGOUT);
    } catch { }

    // 5. Clear secure storage
    try {
      await secureStorage.removeItem(AUTH_STORAGE_KEYS.accessToken);
      await secureStorage.removeItem(AUTH_STORAGE_KEYS.refreshToken);
      await secureStorage.removeItem(AUTH_STORAGE_KEYS.user);
    } catch { }
  },
  requestRegister: () => {
    // Exit guest mode and signal RootNavigator to show Register screen
    set({ isGuest: false, pendingRegisterRedirect: true });
  },
  clearRegisterRedirect: () => {
    set({ pendingRegisterRedirect: false });
  },
}));
