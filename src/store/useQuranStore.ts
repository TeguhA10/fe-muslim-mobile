import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { QuranApiService, SurahItem } from '../services/quranApi.service';

const QURAN_STORAGE_KEY = 'user_quran_settings_v1';

export interface LastReadItem {
  surahNumber: number;
  surahName: string;
  ayahNumber: number;
  timestamp: number;
}

export interface BookmarkItem {
  id: string; // surahNumber:ayahNumber
  surahNumber: number;
  surahName: string;
  ayahNumber: number;
  textArab: string;
  createdAt: number;
}

interface QuranStoreState {
  surahs: SurahItem[];
  isLoadingSurahs: boolean;
  surahError: string | null;
  lastRead: LastReadItem | null;
  bookmarks: BookmarkItem[];
  fontSizeArabic: number;
  showTranslation: boolean;
  showLatin: boolean;

  fetchSurahs: () => Promise<void>;
  setLastRead: (surahNumber: number, surahName: string, ayahNumber: number) => Promise<void>;
  toggleBookmark: (surahNumber: number, surahName: string, ayahNumber: number, textArab: string) => Promise<void>;
  isBookmarked: (surahNumber: number, ayahNumber: number) => boolean;
  setFontSizeArabic: (size: number) => Promise<void>;
  setShowTranslation: (val: boolean) => Promise<void>;
  setShowLatin: (val: boolean) => Promise<void>;
  loadQuranStore: () => Promise<void>;
}

export const useQuranStore = create<QuranStoreState>((set, get) => ({
  surahs: [],
  isLoadingSurahs: false,
  surahError: null,
  lastRead: null,
  bookmarks: [],
  fontSizeArabic: 24,
  showTranslation: true,
  showLatin: true,

  fetchSurahs: async () => {
    if (get().surahs.length > 0) return;
    set({ isLoadingSurahs: true, surahError: null });
    try {
      const data = await QuranApiService.getAllSurahs();
      set({ surahs: data, isLoadingSurahs: false });
    } catch (e: any) {
      set({ surahError: e?.message || 'Gagal memuat daftar Surah', isLoadingSurahs: false });
    }
  },

  setLastRead: async (surahNumber, surahName, ayahNumber) => {
    const item: LastReadItem = {
      surahNumber,
      surahName,
      ayahNumber,
      timestamp: Date.now(),
    };
    set({ lastRead: item });

    const currentData = {
      lastRead: item,
      bookmarks: get().bookmarks,
      fontSizeArabic: get().fontSizeArabic,
      showTranslation: get().showTranslation,
      showLatin: get().showLatin,
    };
    AsyncStorage.setItem(QURAN_STORAGE_KEY, JSON.stringify(currentData)).catch(() => {});
  },

  toggleBookmark: async (surahNumber, surahName, ayahNumber, textArab) => {
    const id = `${surahNumber}:${ayahNumber}`;
    const currentBookmarks = get().bookmarks;
    const exists = currentBookmarks.some((b) => b.id === id);

    let updated: BookmarkItem[];
    if (exists) {
      updated = currentBookmarks.filter((b) => b.id !== id);
    } else {
      updated = [
        {
          id,
          surahNumber,
          surahName,
          ayahNumber,
          textArab,
          createdAt: Date.now(),
        },
        ...currentBookmarks,
      ];
    }

    set({ bookmarks: updated });
    const currentData = {
      lastRead: get().lastRead,
      bookmarks: updated,
      fontSizeArabic: get().fontSizeArabic,
      showTranslation: get().showTranslation,
      showLatin: get().showLatin,
    };
    AsyncStorage.setItem(QURAN_STORAGE_KEY, JSON.stringify(currentData)).catch(() => {});
  },

  isBookmarked: (surahNumber, ayahNumber) => {
    const id = `${surahNumber}:${ayahNumber}`;
    return get().bookmarks.some((b) => b.id === id);
  },

  setFontSizeArabic: async (size) => {
    set({ fontSizeArabic: size });
    const currentData = {
      lastRead: get().lastRead,
      bookmarks: get().bookmarks,
      fontSizeArabic: size,
      showTranslation: get().showTranslation,
      showLatin: get().showLatin,
    };
    AsyncStorage.setItem(QURAN_STORAGE_KEY, JSON.stringify(currentData)).catch(() => {});
  },

  setShowTranslation: async (val) => {
    set({ showTranslation: val });
    const currentData = {
      lastRead: get().lastRead,
      bookmarks: get().bookmarks,
      fontSizeArabic: get().fontSizeArabic,
      showTranslation: val,
      showLatin: get().showLatin,
    };
    AsyncStorage.setItem(QURAN_STORAGE_KEY, JSON.stringify(currentData)).catch(() => {});
  },

  setShowLatin: async (val) => {
    set({ showLatin: val });
    const currentData = {
      lastRead: get().lastRead,
      bookmarks: get().bookmarks,
      fontSizeArabic: get().fontSizeArabic,
      showTranslation: get().showTranslation,
      showLatin: val,
    };
    AsyncStorage.setItem(QURAN_STORAGE_KEY, JSON.stringify(currentData)).catch(() => {});
  },

  loadQuranStore: async () => {
    try {
      const raw = await AsyncStorage.getItem(QURAN_STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (parsed.lastRead) set({ lastRead: parsed.lastRead });
        if (Array.isArray(parsed.bookmarks)) set({ bookmarks: parsed.bookmarks });
        if (typeof parsed.fontSizeArabic === 'number') set({ fontSizeArabic: parsed.fontSizeArabic });
        if (typeof parsed.showTranslation === 'boolean') set({ showTranslation: parsed.showTranslation });
        if (typeof parsed.showLatin === 'boolean') set({ showLatin: parsed.showLatin });
      }
    } catch {}
  },
}));

// Hydrate on load
useQuranStore.getState().loadQuranStore();
