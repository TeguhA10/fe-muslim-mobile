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
const TRANSLATIONS: Partial<Record<LanguageId, Record<string, string>>> = {
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
};

export interface PrayerSoundSettings {
  Subuh: string;
  Dzuhur: string;
  Ashar: string;
  Maghrib: string;
  Isya: string;
}

export interface AdzanSoundOption {
  id: string;
  name: string;
  description: string;
}

export const DEFAULT_PRAYER_SOUNDS: PrayerSoundSettings = {
  Subuh: 'adzan_subuh_makkah',
  Dzuhur: 'adzan_makkah',
  Ashar: 'adzan_makkah',
  Maghrib: 'adzan_madinah',
  Isya: 'adzan_makkah',
};

export const ADZAN_SOUND_OPTIONS: AdzanSoundOption[] = [
  { id: 'adzan_makkah', name: 'Adzan Makkah (Maghrib)', description: 'Kumandang adzan khas Maghrib Masjidil Haram Makkah' },
  { id: 'adzan_madinah', name: 'Adzan Madinah', description: 'Kumandang adzan khas Masjid Nabawi Madinah' },
  { id: 'adzan_subuh_makkah', name: 'Adzan Subuh Misyari Rasyid', description: 'Kumandang adzan Subuh Makkah oleh Sheikh Misyari Rasyid' },
  { id: 'adzan_soft', name: 'Adzan Merdu Mehdi Yarrahi', description: 'Lantunan adzan merdu & syahdu oleh Mehdi Yarrahi' },
  { id: 'chime_short', name: 'Ringtone Pengingat Singkat', description: 'Nada bip / pengingat singkat 5 detik' },
  { id: 'silent', name: 'Hening (Tanpa Suara)', description: 'Hanya notifikasi visual & getar' },
];

interface SettingsStoreState {
  calculationMethod: CalculationMethodId;
  language: LanguageId;
  reminderOffsetMinutes: number;
  notifAdzanEnabled: boolean;
  stickyNotifEnabled: boolean;
  prayerSounds: PrayerSoundSettings;
  setCalculationMethod: (method: CalculationMethodId) => Promise<void>;
  setLanguage: (lang: LanguageId) => Promise<void>;
  setReminderOffsetMinutes: (minutes: number) => Promise<void>;
  setNotifAdzanEnabled: (enabled: boolean) => Promise<void>;
  setStickyNotifEnabled: (enabled: boolean) => Promise<void>;
  setPrayerSound: (prayerName: keyof PrayerSoundSettings, soundId: string) => Promise<void>;
  loadSettings: () => Promise<void>;
  t: (key: string) => string;
}

export const useSettingsStore = create<SettingsStoreState>((set, get) => ({
  calculationMethod: 'KEMENAG',
  language: 'id',
  reminderOffsetMinutes: 10,
  notifAdzanEnabled: true,
  stickyNotifEnabled: false,
  prayerSounds: DEFAULT_PRAYER_SOUNDS,

  setCalculationMethod: async (method) => {
    set({ calculationMethod: method });
    const currentSettings = {
      calculationMethod: method,
      language: get().language,
      reminderOffsetMinutes: get().reminderOffsetMinutes,
      stickyNotifEnabled: get().stickyNotifEnabled,
      prayerSounds: get().prayerSounds,
    };
    AsyncStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(currentSettings)).catch(() => { });
    try {
      await apiClient.post(ENDPOINTS.AUTH.SETTINGS, { calculation_method: method });
    } catch (e) { }
  },

  setLanguage: async (lang) => {
    set({ language: lang });
    const currentSettings = {
      calculationMethod: get().calculationMethod,
      language: lang,
      reminderOffsetMinutes: get().reminderOffsetMinutes,
      stickyNotifEnabled: get().stickyNotifEnabled,
      prayerSounds: get().prayerSounds,
    };
    AsyncStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(currentSettings)).catch(() => { });
    try {
      await apiClient.post(ENDPOINTS.AUTH.SETTINGS, { language: lang });
    } catch (e) { }
  },

  setReminderOffsetMinutes: async (minutes) => {
    set({ reminderOffsetMinutes: minutes });
    const currentSettings = {
      calculationMethod: get().calculationMethod,
      language: get().language,
      reminderOffsetMinutes: minutes,
      stickyNotifEnabled: get().stickyNotifEnabled,
      prayerSounds: get().prayerSounds,
    };
    AsyncStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(currentSettings)).catch(() => { });
    try {
      await apiClient.post(ENDPOINTS.AUTH.SETTINGS, { reminder_offset_minutes: minutes });
    } catch (e) { }
  },

  setNotifAdzanEnabled: async (enabled) => {
    set({ notifAdzanEnabled: enabled });
    const currentSettings = {
      calculationMethod: get().calculationMethod,
      language: get().language,
      reminderOffsetMinutes: get().reminderOffsetMinutes,
      notifAdzanEnabled: enabled,
      stickyNotifEnabled: get().stickyNotifEnabled,
      prayerSounds: get().prayerSounds,
    };
    AsyncStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(currentSettings)).catch(() => { });
    try {
      await apiClient.post(ENDPOINTS.AUTH.SETTINGS, { notif_adzan_enabled: enabled });
    } catch (e) { }
  },

  setStickyNotifEnabled: async (enabled) => {
    set({ stickyNotifEnabled: enabled });
    const currentSettings = {
      calculationMethod: get().calculationMethod,
      language: get().language,
      reminderOffsetMinutes: get().reminderOffsetMinutes,
      stickyNotifEnabled: enabled,
      prayerSounds: get().prayerSounds,
    };
    AsyncStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(currentSettings)).catch(() => { });
    try {
      await apiClient.post(ENDPOINTS.AUTH.SETTINGS, { sticky_notif_enabled: enabled });
    } catch (e) { }
  },

  setPrayerSound: async (prayerName, soundId) => {
    const updatedSounds = { ...get().prayerSounds, [prayerName]: soundId };
    set({ prayerSounds: updatedSounds });
    const currentSettings = {
      calculationMethod: get().calculationMethod,
      language: get().language,
      reminderOffsetMinutes: get().reminderOffsetMinutes,
      notifAdzanEnabled: get().notifAdzanEnabled,
      stickyNotifEnabled: get().stickyNotifEnabled,
      prayerSounds: updatedSounds,
    };
    AsyncStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(currentSettings)).catch(() => { });
    try {
      await apiClient.post(ENDPOINTS.AUTH.SETTINGS, { prayer_sounds: updatedSounds });
    } catch (e) { }
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
        if (typeof parsed.notifAdzanEnabled === 'boolean') set({ notifAdzanEnabled: parsed.notifAdzanEnabled });
        if (parsed.prayerSounds) set({ prayerSounds: { ...DEFAULT_PRAYER_SOUNDS, ...parsed.prayerSounds } });
      }
    } catch { }
  },

  t: (key: string) => {
    const lang = get().language || 'id';
    return TRANSLATIONS[lang]?.[key] || TRANSLATIONS['id']?.[key] || key;
  },
}));

// Auto-hydrate settings on module import
useSettingsStore.getState().loadSettings();
