import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { apiClient } from '../api/apiClient';
import { ENDPOINTS } from '../api/endpoints';

const SETTINGS_STORAGE_KEY = 'user_app_settings_v1';

export type CalculationMethodId = 'KEMENAG' | 'MWL' | 'ISNA' | 'EGYPT' | 'MAKKAH';
export type LanguageId = 'id' | 'en' | 'ar';

export interface CalculationMethodOption {
  id: CalculationMethodId;
  name: string;
  sub: string;
}

export interface LanguageOption {
  id: LanguageId;
  name: string;
  native: string;
}

export interface ReminderOffsetOption {
  minutes: number;
  label: string;
  sub: string;
}

export const CALCULATION_METHODS: CalculationMethodOption[] = [
  { id: 'KEMENAG', name: 'Kementerian Agama RI (KEMENAG)', sub: 'Standar Indonesia (Kemenag)' },
  { id: 'MWL', name: 'Muslim World League (MWL)', sub: 'Liga Muslim Dunia' },
  { id: 'ISNA', name: 'Islamic Society of North America (ISNA)', sub: 'Amerika Utara' },
  { id: 'EGYPT', name: 'Egyptian General Authority of Survey', sub: 'Mesir & Afrika Utara' },
  { id: 'MAKKAH', name: 'Umm Al-Qura University, Makkah', sub: 'Arab Saudi & Teluk' },
];

export const LANGUAGES: LanguageOption[] = [
  { id: 'id', name: 'Bahasa Indonesia', native: 'Bahasa Indonesia (ID)' },
  { id: 'en', name: 'English', native: 'English (US)' },
  { id: 'ar', name: 'العربية', native: 'العربية (Arabic)' },
];

export const REMINDER_OFFSETS: ReminderOffsetOption[] = [
  { minutes: 0, label: 'Tepat Saat Adzan (0 menit)', sub: 'Notifikasi tepat saat masuk waktu sholat' },
  { minutes: 5, label: '5 Menit Sebelum Adzan', sub: 'Pengingat 5 menit sebelum adzan berkumandang' },
  { minutes: 10, label: '10 Menit Sebelum Adzan', sub: 'Pengingat 10 menit sebelum adzan (Standar)' },
  { minutes: 15, label: '15 Menit Sebelum Adzan', sub: 'Pengingat 15 menit sebelum adzan' },
];

// i18n Translations Dictionary
const TRANSLATIONS: Record<LanguageId, Record<string, string>> = {
  id: {
    home: 'Beranda',
    adzan: 'Jadwal Sholat',
    ibadah: 'Modul Ibadah',
    maps: 'Peta Masjid',
    profile: 'Profil & Pengaturan',
    subuh: 'Subuh',
    dzuhur: 'Dzuhur',
    ashar: 'Ashar',
    maghrib: 'Maghrib',
    isya: 'Isya',
    completed: 'Telah dikerjakan',
    next_prayer: 'Menuju Sholat',
    calculation_method: 'Metode Penghitungan Jadwal',
    language: 'Bahasa Aplikasi',
    dark_mode: 'Tema Gelap',
    light_mode: 'Tema Terang',
    logout: 'Keluar Akun',
    saved: 'Tersimpan',
  },
  en: {
    home: 'Home',
    adzan: 'Prayer Times',
    ibadah: 'Worship Module',
    maps: 'Mosque Finder',
    profile: 'Profile & Settings',
    subuh: 'Fajr',
    dzuhur: 'Dhuhr',
    ashar: 'Asr',
    maghrib: 'Maghrib',
    isya: 'Isha',
    completed: 'Completed',
    next_prayer: 'Next Prayer',
    calculation_method: 'Calculation Method',
    language: 'App Language',
    dark_mode: 'Dark Mode',
    light_mode: 'Light Mode',
    logout: 'Logout',
    saved: 'Saved',
  },
  ar: {
    home: 'الرئيسية',
    adzan: 'مواقيت الصلاة',
    ibadah: 'العبادات',
    maps: 'المساجد',
    profile: 'الملف الشخصي',
    subuh: 'الفجر',
    dzuhur: 'الظهر',
    ashar: 'العصر',
    maghrib: 'المغرب',
    isya: 'العشاء',
    completed: 'تمت الصلاة',
    next_prayer: 'الصلاة القادمة',
    calculation_method: 'طريقة حساب المواقيت',
    language: 'لغة التطبيق',
    dark_mode: 'الوضع الداكن',
    light_mode: 'الوضع الفاتح',
    logout: 'تسجيل الخروج',
    saved: 'المحفوظات',
  },
};

interface SettingsStoreState {
  calculationMethod: CalculationMethodId;
  language: LanguageId;
  reminderOffsetMinutes: number;
  stickyNotifEnabled: boolean;
  setCalculationMethod: (method: CalculationMethodId) => Promise<void>;
  setLanguage: (lang: LanguageId) => Promise<void>;
  setReminderOffsetMinutes: (minutes: number) => Promise<void>;
  setStickyNotifEnabled: (enabled: boolean) => Promise<void>;
  loadSettings: () => Promise<void>;
  t: (key: string) => string;
}

export const useSettingsStore = create<SettingsStoreState>((set, get) => ({
  calculationMethod: 'KEMENAG',
  language: 'id',
  reminderOffsetMinutes: 10,
  stickyNotifEnabled: true,

  setCalculationMethod: async (method) => {
    set({ calculationMethod: method });
    const currentSettings = {
      calculationMethod: method,
      language: get().language,
      reminderOffsetMinutes: get().reminderOffsetMinutes,
      stickyNotifEnabled: get().stickyNotifEnabled,
    };
    AsyncStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(currentSettings)).catch(() => {});
    try {
      await apiClient.post(ENDPOINTS.AUTH.SETTINGS, { calculation_method: method });
    } catch (e) {}
  },

  setLanguage: async (lang) => {
    set({ language: lang });
    const currentSettings = {
      calculationMethod: get().calculationMethod,
      language: lang,
      reminderOffsetMinutes: get().reminderOffsetMinutes,
      stickyNotifEnabled: get().stickyNotifEnabled,
    };
    AsyncStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(currentSettings)).catch(() => {});
    try {
      await apiClient.post(ENDPOINTS.AUTH.SETTINGS, { language: lang });
    } catch (e) {}
  },

  setReminderOffsetMinutes: async (minutes) => {
    set({ reminderOffsetMinutes: minutes });
    const currentSettings = {
      calculationMethod: get().calculationMethod,
      language: get().language,
      reminderOffsetMinutes: minutes,
      stickyNotifEnabled: get().stickyNotifEnabled,
    };
    AsyncStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(currentSettings)).catch(() => {});
    try {
      await apiClient.post(ENDPOINTS.AUTH.SETTINGS, { reminder_offset_minutes: minutes });
    } catch (e) {}
  },

  setStickyNotifEnabled: async (enabled) => {
    set({ stickyNotifEnabled: enabled });
    const currentSettings = {
      calculationMethod: get().calculationMethod,
      language: get().language,
      reminderOffsetMinutes: get().reminderOffsetMinutes,
      stickyNotifEnabled: enabled,
    };
    AsyncStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(currentSettings)).catch(() => {});
    try {
      await apiClient.post(ENDPOINTS.AUTH.SETTINGS, { sticky_notif_enabled: enabled });
    } catch (e) {}
  },

  loadSettings: async () => {
    try {
      const saved = await AsyncStorage.getItem(SETTINGS_STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.calculationMethod) set({ calculationMethod: parsed.calculationMethod });
        if (parsed.language) set({ language: parsed.language });
        if (typeof parsed.reminderOffsetMinutes === 'number') set({ reminderOffsetMinutes: parsed.reminderOffsetMinutes });
        if (typeof parsed.stickyNotifEnabled === 'boolean') set({ stickyNotifEnabled: parsed.stickyNotifEnabled });
      }
    } catch {}
  },

  t: (key: string) => {
    const lang = get().language || 'id';
    return TRANSLATIONS[lang]?.[key] || TRANSLATIONS.id[key] || key;
  },
}));

// Auto-hydrate settings on module import
useSettingsStore.getState().loadSettings();
