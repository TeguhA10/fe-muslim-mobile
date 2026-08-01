import { create } from 'zustand';
import { User } from '../types';
import { setAuthToken } from '../api/apiClient';
import AsyncStorage from '@react-native-async-storage/async-storage';

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
    set({ user, token, refreshToken, isAuthenticated: true, isGuest: false, pendingRegisterRedirect: false });
    try {
      await AsyncStorage.multiSet([
        [AUTH_STORAGE_KEYS.accessToken, token],
        [AUTH_STORAGE_KEYS.refreshToken, refreshToken || ''],
        [AUTH_STORAGE_KEYS.user, JSON.stringify(user)],
      ]);
    } catch {}
  },
  setTokens: async (token, refreshToken = null) => {
    setAuthToken(token);
    set({ token, refreshToken, isAuthenticated: true, isGuest: false });
    try {
      await AsyncStorage.multiSet([
        [AUTH_STORAGE_KEYS.accessToken, token],
        [AUTH_STORAGE_KEYS.refreshToken, refreshToken || ''],
      ]);
    } catch {}
  },
  setUser: async (user) => {
    set({ user });
    try {
      if (user) await AsyncStorage.setItem(AUTH_STORAGE_KEYS.user, JSON.stringify(user));
      else await AsyncStorage.removeItem(AUTH_STORAGE_KEYS.user);
    } catch {}
  },
  continueAsGuest: () => {
    set({ isGuest: true, pendingRegisterRedirect: false });
  },
  logout: async () => {
    setAuthToken(null);
    set({ user: null, token: null, refreshToken: null, isAuthenticated: false, isGuest: false, pendingRegisterRedirect: false });
    try {
      await AsyncStorage.multiRemove([AUTH_STORAGE_KEYS.accessToken, AUTH_STORAGE_KEYS.refreshToken, AUTH_STORAGE_KEYS.user]);
    } catch {}
  },
  requestRegister: () => {
    // Exit guest mode and signal RootNavigator to show Register screen
    set({ isGuest: false, pendingRegisterRedirect: true });
  },
  clearRegisterRedirect: () => {
    set({ pendingRegisterRedirect: false });
  },
}));
