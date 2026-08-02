import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';

const THEME_STORAGE_KEY = 'user_saved_theme_v1';

export interface ThemeColors {
  primary: string;
  primaryDark: string;
  primaryLight: string;
  secondary: string;
  accent: string;
  background: string;
  surface: string;
  cardBg: string;
  text: string;
  textMuted: string;
  border: string;
  error: string;
  success: string;
  isDark: boolean;
}

export const LIGHT_THEME: ThemeColors = {
  primary: '#0F5132',
  primaryDark: '#0B3B24',
  primaryLight: '#D1E7DD',
  secondary: '#198754',
  accent: '#D4AF37',
  background: '#F8FAFC',
  surface: '#FFFFFF',
  cardBg: '#FFFFFF',
  text: '#1E293B',
  textMuted: '#64748B',
  border: '#E2E8F0',
  error: '#EF4444',
  success: '#10B981',
  isDark: false,
};

export const DARK_THEME: ThemeColors = {
  primary: '#10B981',
  primaryDark: '#064E3B',
  primaryLight: '#065F46',
  secondary: '#34D399',
  accent: '#F59E0B',
  background: '#0F172A',
  surface: '#1E293B',
  cardBg: '#1E293B',
  text: '#F8FAFC',
  textMuted: '#94A3B8',
  border: '#334155',
  error: '#F87171',
  success: '#34D399',
  isDark: true,
};

interface ThemeStoreState {
  isDarkMode: boolean;
  colors: ThemeColors;
  toggleTheme: () => void;
  setDarkMode: (enabled: boolean) => void;
  loadSavedTheme: () => Promise<void>;
}

export const useThemeStore = create<ThemeStoreState>((set, get) => ({
  isDarkMode: false,
  colors: LIGHT_THEME,
  toggleTheme: () => {
    const nextDark = !get().isDarkMode;
    set({
      isDarkMode: nextDark,
      colors: nextDark ? DARK_THEME : LIGHT_THEME,
    });
    AsyncStorage.setItem(THEME_STORAGE_KEY, JSON.stringify({ isDarkMode: nextDark })).catch(() => {});
  },
  setDarkMode: (enabled) => {
    set({
      isDarkMode: enabled,
      colors: enabled ? DARK_THEME : LIGHT_THEME,
    });
    AsyncStorage.setItem(THEME_STORAGE_KEY, JSON.stringify({ isDarkMode: enabled })).catch(() => {});
  },
  loadSavedTheme: async () => {
    try {
      const saved = await AsyncStorage.getItem(THEME_STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (typeof parsed.isDarkMode === 'boolean') {
          set({
            isDarkMode: parsed.isDarkMode,
            colors: parsed.isDarkMode ? DARK_THEME : LIGHT_THEME,
          });
        }
      }
    } catch {}
  },
}));

// Auto-load saved theme on initial script import
useThemeStore.getState().loadSavedTheme();
